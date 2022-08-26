// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Timelock} from "../dao/timelock/FeiDAOTimelock.sol";

/// @title Fei DAO timelock burner
/// @notice Accepst the admin of the Fei DAO timelock, in order to burn it and render the timelock unuseable
contract FeiDAOBurnerTimelock {
    /// @notice Fei DAO timelock
    Timelock public constant TIMELOCK = Timelock(payable(0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c));

    /// @notice Accept the admin of the FEI DAO timelock
    function acceptAdmin() external {
        TIMELOCK.acceptAdmin();
    }
}
