// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Core} from "../../../core/Core.sol";
import {Vm} from "./../../utils/Vm.sol";
import {DSTest} from "./../../utils/DSTest.sol";
import {MultiPartyTimelockedDelegator} from "../../../timelocks/MultiPartyTimelockedDelegator.sol";
import {getCore, getAddresses, FeiTestAddresses} from "./../../utils/Fixtures.sol";
import {MockTribe} from "../../../mock/MockTribe.sol";

contract MultiPartyTimelockedDelegatorTest is DSTest {
    MultiPartyTimelockedDelegator private timelockDelegator;
    MockTribe private tribe;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses public addresses = getAddresses();
    uint256 duration = 1000;
    address beneficiary = address(1);
    address delegationManager = address(2);

    uint256 tribeMint = 100000;

    function setUp() public {
        tribe = new MockTribe();
        timelockDelegator = new MultiPartyTimelockedDelegator(address(tribe), beneficiary, duration, delegationManager);

        // Mint TRIBE for delegation to the timelockDelegator
        tribe.mint(address(timelockDelegator), tribeMint);
    }

    function testInitialState() public {
        assertEq(timelockDelegator.delegationManager(), delegationManager);
        assertEq(timelockDelegator.totalDelegated(), 0);
        assertEq(timelockDelegator.totalToken(), tribeMint);
    }

    function testSetDelegationManager() public {
        address newDelegationManager = address(3);
        vm.prank(beneficiary);
        timelockDelegator.setDelegationManager(newDelegationManager);

        assertEq(timelockDelegator.delegationManager(), newDelegationManager);
    }

    function testOnlyBeneficiarySetDelegationManager() public {
        address newDelegationManager = address(3);
        vm.expectRevert(bytes("TokenTimelock: Caller is not a beneficiary"));
        timelockDelegator.setDelegationManager(newDelegationManager);
    }

    function testDelegateFromBeneficiary() public {
        address delegatee = address(4);
        uint256 delegateAmount = 100;

        vm.prank(beneficiary);
        timelockDelegator.delegate(delegatee, delegateAmount);

        // Verify delegation was made
        assertEq(timelockDelegator.totalDelegated(), delegateAmount);
        assertEq(timelockDelegator.totalToken(), tribeMint);

        address delegateeContract = timelockDelegator.delegateContract(delegatee);
        assertEq(tribe.balanceOf(delegateeContract), delegateAmount);
    }

    function testDelegateFromManager() public {
        address delegatee = address(4);
        uint256 delegateAmount = 100;

        vm.prank(delegationManager);
        timelockDelegator.delegate(delegatee, delegateAmount);
    }

    function testUndelegateFromBeneficiary() public {
        address delegatee = address(4);
        uint256 delegateAmount = 100;

        vm.prank(beneficiary);
        timelockDelegator.delegate(delegatee, delegateAmount);

        // Undelegate
        vm.prank(beneficiary);
        timelockDelegator.undelegate(delegatee);

        // Verify undelegation was made
        assertEq(timelockDelegator.totalDelegated(), 0);
        assertEq(timelockDelegator.totalToken(), tribeMint);

        address delegateeContract = timelockDelegator.delegateContract(delegatee);
        assertEq(tribe.balanceOf(delegateeContract), 0);
    }

    function testUndelegateFromManager() public {
        address delegatee = address(4);
        uint256 delegateAmount = 100;

        vm.prank(beneficiary);
        timelockDelegator.delegate(delegatee, delegateAmount);

        // Undelegate
        vm.prank(delegationManager);
        timelockDelegator.undelegate(delegatee);
    }
}
