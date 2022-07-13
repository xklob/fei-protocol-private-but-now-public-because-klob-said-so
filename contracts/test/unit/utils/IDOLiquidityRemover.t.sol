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
import {MockERC20} from "../../../mock/MockERC20.sol";
import {Constants} from "../../../Constants.sol";

contract IDOLiquidityRemoverTest is DSTest {
    IDOLiquidityRemover idoRemover;
    address feiTo = address(1);
    address tribeTo = address(1);

    FeiTestAddresses public addresses = getAddresses();
    Core core = getCore();

    uint112 reserve0 = 1000;
    uint112 reserve1 = 5000; // 5:1 ratio
    uint256 initialLiquidity = 10000;

    function setUp() public {
        MockERC20 token = new MockERC20();
        MockUniswapV2PairLiquidity pair = new MockUniswapV2PairLiquidity(address(core.fei()), address(token));
        MockRouter router = new MockRouter(address(pair));

        idoRemover = new IDOLiquidityRemover(address(core), feiTo, tribeTo, address(router), address(pair));

        // Set reserves
        pair.set(reserve0, reserve1, initialLiquidity);
    }

    /// @notice Validate that get reserves fetches the Fei and Tribe reserves
    function testGetReserves() public {
        (uint256 feiReserves, uint256 tokenReserves) = idoRemover.getReserves();
        assertEq(feiReserves, reserve0);
        assertEq(tokenReserves, reserve1);
    }

    /// @notice Validate that get min amounts out calculates the underlying received
    //          when a number of LP tokens are burned, with a maxmimum slippage factor applied
    function testGetMinAmountsOut() public {
        uint256 amountLP = 1000;
        uint256 maxSlippageBasisPoints = 200;
        (uint256 minFeiOut, uint256 minTribeOut) = idoRemover.getMinAmountsOut(amountLP, maxSlippageBasisPoints);

        uint256 expectedFeiOut = (((amountLP * reserve0) / initialLiquidity) *
            (Constants.BASIS_POINTS_GRANULARITY - maxSlippageBasisPoints)) / Constants.BASIS_POINTS_GRANULARITY;
        uint256 expectedTribeOut = (((amountLP * reserve1) / initialLiquidity) *
            (Constants.BASIS_POINTS_GRANULARITY - maxSlippageBasisPoints)) / Constants.BASIS_POINTS_GRANULARITY;

        assertEq(minFeiOut, expectedFeiOut);
        assertEq(minTribeOut, expectedTribeOut);
    }
}
