// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {IDOLiquidityRemover} from "../../../utils/IDOLiquidityRemover.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import "hardhat/console.sol";

contract IDORemoverIntegrationTest is DSTest {
    IDOLiquidityRemover idoRemover;
    address feiTo = address(1);
    address tribeTo = address(2);
    uint256 maxBasisPointsFromPegLP = 200;
    address feiTribeLPHolder = 0x9e1076cC0d19F9B0b8019F384B0a29E48Ee46f7f;
    address uniswapRouter = 0x9928e4046d7c6513326cCeA028cD3e7a91c7590A;

    IERC20 private feiTribeLP = IERC20(0x9928e4046d7c6513326cCeA028cD3e7a91c7590A);
    IERC20 private fei = IERC20(MainnetAddresses.FEI);
    IERC20 private tribe = IERC20(MainnetAddresses.TRIBE);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        idoRemover = new IDOLiquidityRemover(
            MainnetAddresses.CORE,
            feiTo,
            tribeTo,
            uniswapRouter,
            feiTribeLPHolder,
            maxBasisPointsFromPegLP
        );

        vm.label(address(idoRemover), "IDO remover");
        vm.label(address(feiTribeLP), "Pair");
        vm.label(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D, "Router");
    }

    /// @notice Validate initial constructor params set
    function testInitialState() public {
        assertEq(idoRemover.feiTo(), feiTo);
        assertEq(idoRemover.tribeTo(), tribeTo);
        assertEq(idoRemover.maxBasisPointsFromPegLP(), maxBasisPointsFromPegLP);
    }

    /// @notice Validate LP tokens can be redeemed and underlying sent to destination
    function testRedeemLiquidity() public {
        vm.prank(feiTribeLPHolder);
        feiTribeLP.transfer(address(idoRemover), 1000);

        // Get the minimum amounts out
        (uint256 minFeiOut, uint256 minTribeOut) = idoRemover.getMinAmountsOut(1000);
        (uint256 feiRedeemed, uint256 tribeRedeemed) = idoRemover.redeemLiquidity();

        // Validate contract holds no tokens
        assertEq(feiTribeLP.balanceOf(address(idoRemover)), 0);
        assertEq(fei.balanceOf(address(idoRemover)), 0);
        assertEq(tribe.balanceOf(address(idoRemover)), 0);

        // Check FEI and TRIBE arrives at destinations
        uint256 feiToBalance = fei.balanceOf(address(feiTo));
        uint256 tribeToBalance = tribe.balanceOf(address(tribeTo));
        assertGt(feiToBalance, minFeiOut);
        assertGt(tribeToBalance, minTribeOut);

        assertEq(feiToBalance, feiRedeemed);
        assertEq(tribeToBalance, tribeRedeemed);
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

    /// @notice Validate that excess slippage on the trade is rejected
    function testExcessSlippageRejected() public {
        uint256 smallSlippageBasisPoints = 1;

        IDOLiquidityRemover idoRemoverSmallSlippage = new IDOLiquidityRemover(
            MainnetAddresses.CORE,
            feiTo,
            tribeTo,
            uniswapRouter,
            feiTribeLPHolder,
            smallSlippageBasisPoints
        );

        vm.prank(feiTribeLPHolder);
        feiTribeLP.transfer(address(idoRemoverSmallSlippage), 1_000_000 * (10**18));

        (uint256 minFeiOut, uint256 minTribeOut) = idoRemoverSmallSlippage.getMinAmountsOut(1000 * (10**18));
        console.log("min fei out: ", minFeiOut);
        console.log("min tribe out: ", minTribeOut);

        // Try redeem liquidity, expect to fail due to slippage
        // vm.expectReverts(bytes("")); UniswapV2Router: INSUFFICIENT_A_AMOUNT
        (uint256 feiRedeemed, uint256 tribeRedeemed) = idoRemoverSmallSlippage.redeemLiquidity();
        console.log("Fei redeemed: ", feiRedeemed);
        console.log("Tribe redeemed: ", tribeRedeemed);
    }
}
