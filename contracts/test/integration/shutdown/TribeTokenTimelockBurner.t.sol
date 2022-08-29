// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {TribeTokenTimelockBurner} from "../../../shutdown/TribeTokenTimelockBurner.sol";
import {LinearTimelockedDelegator} from "../../../timelocks/LinearTimelockedDelegator.sol";
import {Tribe} from "../../../tribe/Tribe.sol";

/// @notice Integration test for the Tribe token timelocked delegator burner contract
contract TribeTimelockBurnerIntegrationTest is DSTest {
    TribeTokenTimelockBurner rariTribeTimelockBurner;

    LinearTimelockedDelegator rariTribeTimelock =
        LinearTimelockedDelegator(payable(MainnetAddresses.RARI_TRIBE_TOKEN_TIMELOCK));
    Tribe tribe = Tribe(MainnetAddresses.TRIBE);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        rariTribeTimelockBurner = new TribeTokenTimelockBurner(MainnetAddresses.RARI_TRIBE_TOKEN_TIMELOCK);

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

        // Send Tribe to Core treasury
        rariTribeTimelockBurner.sendTribeToTreaury();
        assertEq(tribe.balanceOf(address(rariTribeTimelockBurner)), 0);

        uint256 finalTreasuryBalance = tribe.balanceOf(address(MainnetAddresses.CORE));
        assertEq(finalTreasuryBalance - initialTreasuryBalance, 100);
    }
}
