// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {FeiDAOTimelockBurner} from "../../../shutdown/FeiDAOTimelockBurner.sol";
import {Timelock} from "../../../dao/timelock/Timelock.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

/// @notice Integration tests for the Fei and Rari DAO timelock burner contracts
contract DAOBurnerTimelockIntegrationTest is DSTest {
    FeiDAOTimelockBurner feiDAOBurnerTimelock;

    Timelock feiDAOTimelock = Timelock(payable(MainnetAddresses.FEI_DAO_TIMELOCK));

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        feiDAOBurnerTimelock = new FeiDAOTimelockBurner();

        // Set pending admin of the Fei DAO timelock to be the feiDAOTimelockBurner
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        feiDAOTimelock.setPendingAdmin(address(feiDAOBurnerTimelock));
    }

    /// @notice Validate that admin of the Fei DAO timelock can be accepted
    function testAcceptAdmin() public {
        feiDAOBurnerTimelock.acceptAdmin();
        assertEq(feiDAOTimelock.admin(), address(feiDAOBurnerTimelock));
    }
}
