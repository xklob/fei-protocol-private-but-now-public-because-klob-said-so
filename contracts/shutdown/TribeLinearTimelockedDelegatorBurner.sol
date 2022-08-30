// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Tribe} from "../tribe/Tribe.sol";
import {LinearTimelockedDelegator} from "../timelocks/LinearTimelockedDelegator.sol";

/// @notice Accept Linear TimelockedDelegatorBurner, which can acceptBeneficiary() and permissionlessly send vested
///         TRIBE tokens to the Core Treasury. Does not have an undelegate() method
contract TribeLinearTimelockedDelegatorBurner {
    /// @notice Tribe Linear Timelocked Delegator token timelock
    LinearTimelockedDelegator public immutable timelock;

    /// @notice Core Treasury
    address public constant core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;

    /// @notice TRIBE ERC20 token
    Tribe private constant TRIBE = Tribe(0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B);

    /// @param _tribeTimelock Tribe timelock which can acceptBeneficiary() and releaseMax() tokens
    constructor(LinearTimelockedDelegator _tribeTimelock) {
        timelock = _tribeTimelock;
    }

    /// @notice Accept the beneficiary of the target timelock
    function acceptBeneficiary() external {
        timelock.acceptBeneficiary();
    }

    /// @notice Permissionless method to send all TRIBE held on this contract to the Core Treasury
    function sendTribeToTreaury() external {
        // Release all currently vested TRIBE to this contract
        timelock.releaseMax(address(this));

        // Send released TRIBE to core
        uint256 tribeBalance = TRIBE.balanceOf(address(this));
        if (tribeBalance != 0) {
            TRIBE.transfer(core, tribeBalance);
        }
    }
}