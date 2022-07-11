// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {IUniswapV2Pair} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import {TribeRoles} from "../core/TribeRoles.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {Constants} from "../Constants.sol";

/// @title IDO liquidity remover
/// @notice Allows for the removal of IDO liquidity from Uniswap V2 and sends it to a destination
///         Expected that this contract holds all LP tokens to be redeemed prior to
contract IDOLiquidityRemover is CoreRef {
    using SafeERC20 for IERC20;

    event RemoveLiquidity(
        address indexed feiTo,
        uint256 amountFei,
        address indexed tribeTo,
        uint256 amountTribe,
        address indexed daoTimelock,
        uint256 amountFeiToBurn
    );

    event WithdrawERC20(address indexed _caller, address indexed _token, address indexed _to, uint256 _amount);

    /// @notice Fei destination once liquidity is redeemed
    address public immutable feiTo;

    /// @notice Tribe destination once LP liquidity is redeemed
    address public immutable tribeTo;

    /// @notice Fei-Tribe LP token
    IUniswapV2Pair public immutable pair;

    /// @notice Uniswap V2 router
    IUniswapV2Router02 public immutable uniswapRouter;

    /// @notice DAO timelock to send Fei to be burned
    address public constant daoTimelock = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;

    /// @notice Slippage protection parameter on withdraw
    uint256 public immutable maxBasisPointsFromPegLP;

    constructor(
        address _core,
        address _feiTo,
        address _tribeTo,
        address _uniswapRouter,
        address _uniswapPair,
        uint256 _maxBasisPointsFromPegLP
    ) CoreRef(_core) {
        feiTo = _feiTo;
        tribeTo = _tribeTo;
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        pair = IUniswapV2Pair(_uniswapPair);
        maxBasisPointsFromPegLP = _maxBasisPointsFromPegLP;
    }

    ///////////   Public state changing API   ///////////////

    /// @notice Redeem LP tokens for underlying FEI and TRIBE. Then splits the liquidity three ways:
    ///         1. Send an amount of FEI, amountFeiToTimelock, to the DAO timelock, where it will be burned
    ///         2. Send the remaining FEI to a destination, intended to be a new FEI timelock
    ///         3. Send all unlocked TRIBE liquidity to a destination, intended to be a new TRIBE timelock
    /// @param amountFeiToTimelock Amount of FEI to be transferred to DAO timelock, where it will then be burned
    function redeemLiquidity(uint256 amountFeiToTimelock)
        external
        onlyTribeRole(TribeRoles.GOVERNOR)
        returns (uint256, uint256)
    {
        require(pair.balanceOf(address(this)) > 0, "IDORemover: Insufficient liquidity");

        uint256 amountLP = pair.balanceOf(address(this));

        // Get minimum amounts out after withdrawing liquidity
        (uint256 minFeiOut, uint256 minTribeOut) = getMinAmountsOut(amountLP);

        // Approve Uniswap router to swap tokens
        pair.approve(address(uniswapRouter), amountLP);

        // Remove liquidity from Uniswap and send underlying to this contract
        uniswapRouter.removeLiquidity(
            address(fei()),
            address(tribe()),
            amountLP,
            minFeiOut,
            minTribeOut,
            address(this),
            type(uint256).max
        );

        uint256 feiLiquidity = fei().balanceOf(address(this));
        require(amountFeiToTimelock <= feiLiquidity, "IDORemover: Insufficient FEI");
        uint256 amountFeiTo = feiLiquidity - amountFeiToTimelock;

        uint256 tribeLiquidity = tribe().balanceOf(address(this));

        // Send FEI to be burned to the DAO timelock
        IERC20(fei()).safeTransfer(daoTimelock, amountFeiToTimelock);

        // Send remaining FEI and all TRIBE liquidity to destinations
        IERC20(fei()).safeTransfer(feiTo, amountFeiTo);
        tribe().safeTransfer(tribeTo, tribeLiquidity);

        emit RemoveLiquidity(feiTo, amountFeiTo, tribeTo, tribeLiquidity, daoTimelock, amountFeiToTimelock);
        return (feiLiquidity, tribeLiquidity);
    }

    /// @notice Emergency withdraw function to withdraw funds from the contract
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyTribeRole(TribeRoles.PCV_CONTROLLER) {
        IERC20(token).safeTransfer(to, amount);
        emit WithdrawERC20(msg.sender, token, to, amount);
    }

    /////////////  Read only API  //////////////////

    /// @notice Used for slippage protection when removing liquidity from Uniswap
    function getMinAmountsOut(uint256 amountLP) public view returns (uint256, uint256) {
        uint256 totalSupply = pair.totalSupply();
        (uint256 feiReserves, uint256 tribeReserves) = getReserves();

        // Calculate expected amounts out
        uint256 amountFeiOut = (amountLP * feiReserves) / totalSupply;
        uint256 amountTribeOut = (amountLP * tribeReserves) / totalSupply;

        // Apply slippage protection
        return (_getMinLiquidity(amountFeiOut), _getMinLiquidity(amountTribeOut));
    }

    /// @notice Get the pair reserves, with fei listed first
    function getReserves() public view returns (uint256 feiReserves, uint256 tokenReserves) {
        address token0 = pair.token0();
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        (feiReserves, tokenReserves) = address(fei()) == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        return (feiReserves, tokenReserves);
    }

    /// @notice Apply a slippage factor to determine minimum amount out
    function _getMinLiquidity(uint256 amount) internal view returns (uint256) {
        return
            (amount * (Constants.BASIS_POINTS_GRANULARITY - maxBasisPointsFromPegLP)) /
            Constants.BASIS_POINTS_GRANULARITY;
    }
}
