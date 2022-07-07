// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {IDOLiquidityRemover} from "../../../utils/IDOLiquidityRemover.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";

contract IDORemoverIntegrationTest is DSTest {
    IDOLiquidityRemover idoRemover;
    address feiReceiver = address(1);
    address tribeReceiver = address(2);

    IERC20 private feiTribeLP = IERC20(0x9928e4046d7c6513326cCeA028cD3e7a91c7590A);
    IERC20 private fei = IERC20(MainnetAddresses.FEI);
    IERC20 private tribe = IERC20(MainnetAddresses.TRIBE);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        idoRemover = new IDOLiquidityRemover(MainnetAddresses.CORE, feiReceiver, tribeReceiver);
    }

    function testInitialState() public {
        assertEq(idoRemover.feiTo(), feiReceiver);
        assertEq(idoRemover.tribeTo(), tribeReceiver);
    }

    /// @notice Validate LP tokens can be redeemed for underlying, and underlying FEI and TRIBE
    ///         can be sent to destinations
    function testRedeemLiquidity() public {
        // Drop LP tokens onto the contract
        address feiTribeLPHolder = 0x9e1076cC0d19F9B0b8019F384B0a29E48Ee46f7f;
        vm.prank(feiTribeLPHolder);
        feiTribeLP.transfer(address(idoRemover), 1000);

        idoRemover.redeemLiquidity();

        // Validate contract holds no tokens
        assertEq(feiTribeLP.balanceOf(address(idoRemover)), 0);
        assertEq(fei.balanceOf(address(idoRemover)), 0);
        assertEq(tribe.balanceOf(address(idoRemover)), 0);

        // Check FEI and TRIBE arrives at destinations
        assertGt(fei.balanceOf(address(feiReceiver)), 10);
        assertGt(tribe.balanceOf(address(tribeReceiver)), 10);
    }

    /// @notice Validate that excess slippage on the trade is rejected
    function testExcessSlippageRejected() public {

    }

    /// @notice Validate that can withdraw ERC20s on the contract
    function testCanWithdrawERC20() public {}
}
