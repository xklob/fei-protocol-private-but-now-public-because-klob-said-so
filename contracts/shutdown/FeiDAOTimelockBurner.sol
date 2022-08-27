// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Timelock} from "../dao/timelock/FeiDAOTimelock.sol";

/// @title Fei DAO timelock burner
/// @notice Accepts the admin of the Fei DAO timelock, in order to burn it and prevent it being transferred
contract FeiDAOTimelockBurner {
    /// @notice Fei DAO timelock
    Timelock public constant TIMELOCK = Timelock(payable(0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c));

    /// @notice Accept the admin of the timelock
    function acceptAdmin() external {
        TIMELOCK.acceptAdmin();
    }
}
