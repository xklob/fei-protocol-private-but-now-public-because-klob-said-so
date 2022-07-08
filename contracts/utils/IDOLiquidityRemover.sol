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

    event RemoveLiquidity(address indexed feiTo, uint256 amountFei, address indexed tribeTo, uint256 amountTribe);

    event WithdrawERC20(address indexed _caller, address indexed _token, address indexed _to, uint256 _amount);

    /// @notice Fei destination once liquidity is redeemed
    address public immutable feiTo;

    /// @notice Tribe destination once LP liquidity is redeemed
    address public immutable tribeTo;

    /// @notice Fei-Tribe LP token
    IUniswapV2Pair public immutable pair;

    /// @notice Uniswap V2 router
    IUniswapV2Router02 public immutable uniswapRouter;

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

    ///////////   Public state changing API, NON-PERMISSIONED   ///////////////

    /// @notice Redeem contract LP tokens for underlying feiERC20 and tribeERC20, then transfer to destinations
    function redeemLiquidity() external returns (uint256, uint256) {
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

        uint256 amountFei = fei().balanceOf(address(this));
        uint256 amountTribe = tribe().balanceOf(address(this));

        // Send Fei and Tribe to destinations
        IERC20(fei()).safeTransfer(feiTo, amountFei);
        tribe().safeTransfer(tribeTo, amountTribe);

        emit RemoveLiquidity(feiTo, amountFei, tribeTo, amountTribe);
        return (amountFei, amountTribe);
    }

    /////////   Public state changing API, PERMISSIONED  /////////

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
