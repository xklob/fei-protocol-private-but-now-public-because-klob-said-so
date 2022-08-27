// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {RariDAOTimelockBurner} from "../../../shutdown/RariDAOTimelockBurner.sol";
import {Timelock} from "../../../dao/timelock/Timelock.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

/// @notice Integration tests for the Rari DAO timelock burner contract
contract RariDAOBurnerTimelockIntegrationTest is DSTest {
    RariDAOTimelockBurner rariDAOBurnerTimelock;

    Timelock rariDAOTimelock = Timelock(payable(MainnetAddresses.RARI_DAO_TIMELOCK));

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        rariDAOBurnerTimelock = new RariDAOTimelockBurner();

        // Set pending admin of the Rari DAO timelock to be the rariDAOTimelockBurner
        vm.prank(MainnetAddresses.RARI_DAO_TIMELOCK);
        rariDAOTimelock.setPendingAdmin(address(rariDAOBurnerTimelock));
    }

    /// @notice Validate that admin of the Fei DAO timelock can be accepted
    function testAcceptAdmin() public {
        rariDAOBurnerTimelock.acceptAdmin();
        assertEq(rariDAOTimelock.admin(), address(rariDAOBurnerTimelock));
    }
}
