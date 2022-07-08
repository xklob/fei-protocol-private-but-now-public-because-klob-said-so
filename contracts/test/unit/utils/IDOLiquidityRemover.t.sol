// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {IDOLiquidityRemover} from "../../../utils/IDOLiquidityRemover.sol";
import {MockERC20} from "../../../mock/MockERC20.sol";
import {Core} from "../../../core/Core.sol";
import {Vm} from "./../../utils/Vm.sol";
import {DSTest} from "./../../utils/DSTest.sol";
import {getCore, getAddresses, FeiTestAddresses} from "./../../utils/Fixtures.sol";
import {MockUniswapV2PairLiquidity} from "../../../mock/MockUniswapV2PairLiquidity.sol";
import {MockRouter} from "../../../mock/MockRouter.sol";

contract IDOLiquidityRemoverTest is DSTest {
    IDOLiquidityRemover idoRemover;
    address feiTo = address(1);
    address tribeTo = address(1);
    uint256 maxSlippageBasisPoints = 200;

    FeiTestAddresses public addresses = getAddresses();
    Core core = getCore();

    function setUp() public {
        MockUniswapV2PairLiquidity pair = new MockUniswapV2PairLiquidity();
        MockRouter router = new MockRouter(address(pair));

        idoRemover = new IDOLiquidityRemover(
            address(core),
            feiTo,
            tribeTo,
            address(router),
            address(pair),
            maxSlippageBasisPoints
        );
    }

    /// @notice Validate that get reserves fetches the Fei and Tribe reserves
    function testGetReserves() public {}

    /// @notice Validate that get min amounts out calculates the underlying received
    //          when a number of LP tokens are burned, with a maxmimum slippage factor applied
    function testGetMinAmountsOut() public {}
}
