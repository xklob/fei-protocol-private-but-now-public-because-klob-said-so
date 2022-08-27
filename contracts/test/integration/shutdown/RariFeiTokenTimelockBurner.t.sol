// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {RariFeiTokenTimelockBurner} from "../../../shutdown/RariFeiTokenTimelockBurner.sol";
import {LinearTokenTimelock} from "../../../timelocks/LinearTokenTimelock.sol";
import {Fei} from "../../../fei/Fei.sol";

/// @notice Integration test for the Rari Fei token timelock burner contract
contract RariFeiTimelockBurnerIntegrationTest is DSTest {
    RariFeiTokenTimelockBurner rariFeiTimelockBurner;

    LinearTokenTimelock rariFeiTimelock = LinearTokenTimelock(payable(MainnetAddresses.RARI_FEI_TOKEN_TIMELOCK));
    Fei fei = Fei(MainnetAddresses.FEI);
    address feiWhale = 0xe0C7DE94395B629860Cbb3c42995F300F56e6d7a;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        rariFeiTimelockBurner = new RariFeiTokenTimelockBurner();

        // Set pending admin of the Rari Fei Token timelock to be the rariFeiTimelockBurner
        address rariBeneficiary = rariFeiTimelock.beneficiary();
        vm.prank(rariBeneficiary);
        rariFeiTimelock.setPendingBeneficiary(address(rariFeiTimelockBurner));
    }

    function testAcceptBeneficiary() public {
        rariFeiTimelockBurner.acceptBeneficiary();
        assertEq(rariFeiTimelock.beneficiary(), address(rariFeiTimelockBurner));
    }

    function testBurnFeiHeld() public {
        uint256 initialFeiSupply = fei.totalSupply();

        vm.prank(feiWhale);
        fei.transfer(address(rariFeiTimelockBurner), 100);
        assertEq(fei.balanceOf(address(rariFeiTimelockBurner)), 100);

        // Burn Fei
        rariFeiTimelockBurner.burnFeiHeld();
        assertEq(fei.balanceOf(address(rariFeiTimelockBurner)), 0);

        uint256 finalFeiSupply = fei.totalSupply();
        assertEq(initialFeiSupply - finalFeiSupply, 100);
    }
}
