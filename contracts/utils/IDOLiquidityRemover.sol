// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
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
    IERC20 public constant feiTribeLP = IERC20(0x9928e4046d7c6513326cCeA028cD3e7a91c7590A);

    /// @notice Uniswap V2 router
    IUniswapV2Router02 public uniswapRouter;

    constructor(
        address _core,
        address _feiTo,
        address _tribeTo
    ) CoreRef(_core) {
        feiTo = _feiTo;
        tribeTo = _tribeTo;
    }

    ///////////   PUBLIC API, NON-PERMISSIONED   ///////////////

    /// @notice Redeem contract LP tokens for underlying feiERC20 and tribeERC20, then transfer to destinations
    function redeemLiquidity() external {
        require(feiTribeLP.balanceOf(address(this)) > 0, "IDORemover: Insufficient liquidity");

        // Approve Uniswap router to swap tokens
        feiTribeLP.approve(address(uniswapRouter), feiTribeLP.balanceOf(address(this)));

        // Remove liquidity from Uniswap and send underlying to this contract
        // TODO: Restrictions on withdrawal price
        uniswapRouter.removeLiquidity(
            address(fei()),
            address(tribe()),
            feiTribeLP.balanceOf(address(this)),
            0, // TODO
            0, // TODO
            address(this),
            block.timestamp
        );

        uint256 amountFei = fei().balanceOf(address(this));
        uint256 amountTribe = tribe().balanceOf(address(this));

        // Transfer feiERC20 and tribeERC20 redeemed out to destinations
        IERC20(fei()).safeTransfer(feiTo, amountFei);
        tribe().safeTransfer(tribeTo, amountTribe);

        emit RemoveLiquidity(feiTo, amountFei, tribeTo, amountTribe);
    }

    /////////   PUBLIC API, PERMISSIONED  /////////

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
