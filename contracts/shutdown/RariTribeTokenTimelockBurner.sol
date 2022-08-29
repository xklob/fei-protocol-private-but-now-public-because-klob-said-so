// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Tribe} from "../tribe/Tribe.sol";
import {LinearTimelockedDelegator} from "../timelocks/LinearTimelockedDelegator.sol";

/// @notice Accept the beneficiary of the Rari Tribe token timelock
///         Permissionlessly send any TRIBE held on this contract to the Treasury
contract RariTribeTokenTimelockBurner {
    /// @notice Rari Infra team Tribe token timelock
    LinearTimelockedDelegator public constant TIMELOCK =
        LinearTimelockedDelegator(0x625cf6AA7DafB154F3Eb6BE87592110e30290dEe);

    /// @notice Core Treasury
    address public constant core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;

    /// @notice TRIBE ERC20 token
    Tribe private constant TRIBE = Tribe(0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B);

    /// @notice Accept the beneficiary of the target timelock
    function acceptBeneficiary() external {
        TIMELOCK.acceptBeneficiary();
    }

    /// @notice Permissionless method to send all TRIBE held on this contract to the Core Treasury
    function sendTribeToTreaury() external {
        TIMELOCK.releaseMax(address(this));
        uint256 tribeBalance = TRIBE.balanceOf(address(this));

        if (tribeBalance != 0) {
            TRIBE.transfer(core, tribeBalance);
        }
    }
}
