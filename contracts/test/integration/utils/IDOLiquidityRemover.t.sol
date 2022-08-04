// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {IDOLiquidityRemover} from "../../../utils/IDOLiquidityRemover.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {Constants} from "../../../Constants.sol";

contract IDORemoverIntegrationTest is DSTest {
    IDOLiquidityRemover idoRemover;
    address feiTribeLPHolder = 0x9e1076cC0d19F9B0b8019F384B0a29E48Ee46f7f;
    address uniswapRouter = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    IERC20 private feiTribeLP = IERC20(0x9928e4046d7c6513326cCeA028cD3e7a91c7590A);
    IERC20 private fei = IERC20(MainnetAddresses.FEI);
    IERC20 private tribe = IERC20(MainnetAddresses.TRIBE);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    address feiTo = address(0x42);
    address tribeTo = address(0x43);

    function setUp() public {
        idoRemover = new IDOLiquidityRemover(MainnetAddresses.CORE, feiTo, tribeTo);

        vm.label(address(idoRemover), "IDO remover");
        vm.label(address(feiTribeLP), "Pair");
        vm.label(address(uniswapRouter), "Router");
        vm.label(address(fei), "FEI");
        vm.label(address(tribe), "TRIBE");
        vm.label(feiTo, "feiTo");
        vm.label(tribeTo, "tribeTo");
    }

    function testInitialState() public {
        assertEq(idoRemover.feiTo(), feiTo);
        assertEq(idoRemover.tribeTo(), tribeTo);
        assertEq(address(idoRemover.UNISWAP_ROUTER()), uniswapRouter);
        assertEq(address(idoRemover.FEI_TRIBE_PAIR()), address(feiTribeLP));
    }

    /// @notice Validate redeemLiquidity() fails for out of bounds investorLPBps
    function testRedeemInvestorShareBounds() public {
        vm.expectRevert(bytes("IDORemover: Invalid investor share bps"));
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        idoRemover.redeemLiquidity(Constants.BASIS_POINTS_GRANULARITY + 1, 0, 0);
    }

    /// @notice Validate redeemLiquidity() fails when no LP tokens are on the contract
    function testRedeemNoLPTokens() public {
        vm.expectRevert(bytes("IDORemover: Insufficient liquidity"));
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        idoRemover.redeemLiquidity(2000, 0, 0);
    }

    /// @notice Validate that redeemLiquidity() only calleable by the Governor
    function testRedeemOnlyGovernor() public {
        vm.expectRevert(bytes("UNAUTHORIZED"));
        idoRemover.redeemLiquidity(2000, 0, 0);
    }

    /// @notice Validate LP tokens can be redeemed and these conditions:
    ///         - Investor FEI and TRIBE shares sent to destinations
    ///         - Remaining FEI burned
    ///         - Remaining TRIBE sent to Core
    function testRedeemLiquidity() public {
        uint256 initialFeiSupply = fei.totalSupply();
        uint256 initialCoreBalance = tribe.balanceOf(MainnetAddresses.CORE);

        vm.prank(feiTribeLPHolder);
        feiTribeLP.transfer(address(idoRemover), 1000);

        // Set minimum amounts out
        (uint256 minFeiOut, uint256 minTribeOut) = (50, 50);
        uint256 investorShareBps = 2000; // 20%

        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        (uint256 feiLiquidity, uint256 tribeLiquidity) = idoRemover.redeemLiquidity(
            investorShareBps,
            minFeiOut,
            minTribeOut
        );

        assertGt(feiLiquidity, minFeiOut);
        assertGt(tribeLiquidity, minTribeOut);

        // Validate contract holds no tokens
        assertEq(feiTribeLP.balanceOf(address(idoRemover)), 0);
        assertEq(fei.balanceOf(address(idoRemover)), 0);
        assertEq(tribe.balanceOf(address(idoRemover)), 0);

        // Validate feiTo and tribeTo received FEI and TRIBE
        uint256 expectedFeiTransfer = (feiLiquidity * investorShareBps) / Constants.BASIS_POINTS_GRANULARITY;
        assertEq(fei.balanceOf(feiTo), expectedFeiTransfer);

        uint256 expectedTribeTransfer = (tribeLiquidity * investorShareBps) / Constants.BASIS_POINTS_GRANULARITY;
        assertEq(tribe.balanceOf(tribeTo), expectedTribeTransfer);

        // Validate remaining FEI was burned
        uint256 feiBurned = initialFeiSupply - fei.totalSupply();
        assertGt(feiBurned, 0);
        assertEq(feiBurned, feiLiquidity - expectedFeiTransfer);

        // Validate remaining TRIBE arrived at Core
        uint256 tribeRedeemed = tribe.balanceOf(MainnetAddresses.CORE) - initialCoreBalance;
        assertGt(tribeRedeemed, 0);
        assertEq(tribeRedeemed, tribeLiquidity - expectedTribeTransfer);
    }

    /// @notice Validate that too high slippage fails
    function testRedeemFailsForTooHighSlippage() public {
        vm.prank(feiTribeLPHolder);
        feiTribeLP.transfer(address(idoRemover), 1000);

        // Make min amounts out greater than expected redeemed liquidity
        (uint256 minFeiOut, uint256 minTribeOut) = (1000, 1000);
        uint256 investorShareBps = 2000; // 20%

        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        vm.expectRevert(bytes("UniswapV2Router: INSUFFICIENT_A_AMOUNT"));
        idoRemover.redeemLiquidity(investorShareBps, minFeiOut, minTribeOut);
    }

    /// @notice Validate that can withdraw ERC20s on the contract in an emergency
    function testCanWithdrawERC20() public {
        // Drop tokens onto contract
        vm.prank(MainnetAddresses.CORE);
        tribe.transfer(address(idoRemover), 1000);

        address to = address(4);

        // Withdraw
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        idoRemover.withdrawERC20(address(tribe), to, 1000);

        assertEq(tribe.balanceOf(address(idoRemover)), 0);
        assertEq(tribe.balanceOf(to), 1000);
    }
}
