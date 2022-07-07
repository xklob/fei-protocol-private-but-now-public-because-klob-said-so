// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {CoreRef} from "../refs/CoreRef.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/// @title IDO liquidity remover
/// @notice Allows for the removal of IDO liquidity from Uniswap V2 and sends it to a destination
///         Expected that this contract holds all LP tokens to be redeemed prior to
contract IDOLiquidityRemover is CoreRef {
    using SafeERC20 for IERC20;

    /// @notice Fei destination once liquidity is redeemed
    address public immutable feiTo;

    /// @notice Tribe destination once LP liquidity is redeemed
    address public immutable tribeTo;

    /// @notice FEI ERC20
    IERC20 public immutable FEI = fei();

    /// @notice TRIBE ERC20
    IERC20 public immutable TRIBE = tribe();

    constructor(
        address _core,
        address _feiTo,
        address _tribeTo
    ) CoreRef(_core) {
        feiTo = _feiTo;
        tribeTo = _tribeTo;
    }

    /// @notice Redeem contract LP tokens for underlying FEI and TRIBE, then transfer to destinations
    function redeemLiquidity() external {
        // 1. Redeem all LP tokens for underlying
        // 2. Send underlying to destination
    }
}
