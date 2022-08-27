// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Timelock} from "../dao/timelock/FeiDAOTimelock.sol";

/// @title Rari DAO timelock burner
/// @notice Accepts the admin of the Rari DAO timelock, in order to burn it and prevent it being transferred
contract RariDAOTimelockBurner {
    /// @notice Rari DAO timelock
    Timelock public constant TIMELOCK = Timelock(payable(0x8ace03Fc45139fDDba944c6A4082b604041d19FC));

    /// @notice Accept the admin of the timelock
    function acceptAdmin() external {
        TIMELOCK.acceptAdmin();
    }
}
