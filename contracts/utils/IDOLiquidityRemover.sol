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

    event RemoveLiquidity(uint256 amountFei, uint256 amountTribe);

    event WithdrawERC20(address indexed _caller, address indexed _token, address indexed _to, uint256 _amount);

    /// @notice DAO timelock to send Fei to be burned
    address public constant DAO_TIMELOCK = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;

    /// @notice Uniswap V2 version 2 Router
    IUniswapV2Router02 public constant UNISWAP_ROUTER = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    /// @notice Uniswap Fei-Tribe LP token
    IUniswapV2Pair public constant FEI_TRIBE_PAIR = IUniswapV2Pair(0x9928e4046d7c6513326cCeA028cD3e7a91c7590A);

    constructor(address _core) CoreRef(_core) {}

    ///////////   Public state changing API   ///////////////

    /// @notice Redeem LP tokens for underlying FEI and TRIBE.
    ///         Burn all FEI redeemed and send all TRIBE to Core
    /// @dev WARNING: ASSUMES TIMELOCK.RELEASE_MAX() ALREADY CALLED TO FUND
    ///               BENEFICIARY ACCOUNT
    /// @param minAmountFeiOut Minimum amount of FEI to be redeemed
    /// @param minAmountTribeOut Minimum amount of TRIBE to be redeemed
    function redeemLiquidity(uint256 minAmountFeiOut, uint256 minAmountTribeOut)
        external
        onlyTribeRole(TribeRoles.GOVERNOR)
        returns (uint256, uint256)
    {
        require(FEI_TRIBE_PAIR.balanceOf(address(this)) > 0, "IDORemover: Insufficient liquidity");

        uint256 amountLP = FEI_TRIBE_PAIR.balanceOf(address(this));

        // Approve Uniswap router to swap tokens
        FEI_TRIBE_PAIR.approve(address(UNISWAP_ROUTER), amountLP);

        // Remove liquidity from Uniswap and send underlying to this contract
        UNISWAP_ROUTER.removeLiquidity(
            address(fei()),
            address(tribe()),
            amountLP,
            minAmountFeiOut,
            minAmountTribeOut,
            address(this),
            block.timestamp
        );

        uint256 feiLiquidity = fei().balanceOf(address(this));
        uint256 tribeLiquidity = tribe().balanceOf(address(this));

        // Burn all FEI
        fei().burn(feiLiquidity);

        // Send all TRIBE to Core
        tribe().safeTransfer(address(core()), tribeLiquidity);

        emit RemoveLiquidity(feiLiquidity, tribeLiquidity);
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
}