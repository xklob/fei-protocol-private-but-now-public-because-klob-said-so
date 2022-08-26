// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {FeiDAOBurnerTimelock} from "../../../shutdown/FeiDAOBurnerTimelock.sol";
import {Timelock} from "../../../dao/timelock/Timelock.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

contract FeiDAOBurnerTimelockIntegrationTest is DSTest {
    FeiDAOBurnerTimelock burnerTimelock;
    Timelock feiDAOTimelock = Timelock(payable(MainnetAddresses.FEI_DAO_TIMELOCK));

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        burnerTimelock = new FeiDAOBurnerTimelock();

        // Setup burnerTimelock address to be the pending timelock admin
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        feiDAOTimelock.setPendingAdmin(address(burnerTimelock));
    }

    /// @notice Validate that admin of the Fei DAO timelock can be accepted
    function testAcceptAdmin() public {
        burnerTimelock.acceptAdmin();
        assertEq(feiDAOTimelock.admin(), address(burnerTimelock));
    }
}
