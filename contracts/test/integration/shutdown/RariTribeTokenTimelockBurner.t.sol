// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {RariTribeTokenTimelockBurner} from "../../../shutdown/RariTribeTokenTimelockBurner.sol";
import {LinearTimelockedDelegator} from "../../../timelocks/LinearTimelockedDelegator.sol";
import {Tribe} from "../../../tribe/Tribe.sol";

/// @notice Integration test for the Rari Tribe token timelock burner contract
contract RariTribeTimelockBurnerIntegrationTest is DSTest {
    RariTribeTokenTimelockBurner rariTribeTimelockBurner;

    LinearTimelockedDelegator rariTribeTimelock =
        LinearTimelockedDelegator(payable(MainnetAddresses.RARI_TRIBE_TOKEN_TIMELOCK));
    Tribe tribe = Tribe(MainnetAddresses.TRIBE);
    address tribeWhale = 0xc09BB5ECf865e6f69Fe62A43c27f036A426909f7;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        rariTribeTimelockBurner = new RariTribeTokenTimelockBurner();

        // Set pending admin of the Rari Tribe Token timelock to be the rariTribeTimelockBurner
        address rariBeneficiary = rariTribeTimelock.beneficiary();
        vm.prank(rariBeneficiary);
        rariTribeTimelock.setPendingBeneficiary(address(rariTribeTimelockBurner));
    }

    function testAcceptBeneficiary() public {
        rariTribeTimelockBurner.acceptBeneficiary();
        assertEq(rariTribeTimelock.beneficiary(), address(rariTribeTimelockBurner));
    }

    function testSendTribeToTreasury() public {
        uint256 initialTreasuryBalance = tribe.balanceOf(address(MainnetAddresses.CORE));

        vm.prank(tribeWhale);
        tribe.transfer(address(rariTribeTimelockBurner), 100);
        assertEq(tribe.balanceOf(address(rariTribeTimelockBurner)), 100);

        // Send Tribe to Core treasury
        rariTribeTimelockBurner.sendTribeToTreaury();
        assertEq(tribe.balanceOf(address(rariTribeTimelockBurner)), 0);

        uint256 finalTreasuryBalance = tribe.balanceOf(address(MainnetAddresses.CORE));
        assertEq(finalTreasuryBalance - initialTreasuryBalance, 100);
    }
}
