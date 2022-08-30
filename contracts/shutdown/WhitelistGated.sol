// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title Abstract contract that provides a modifier that can be used to gate functinos
/// @author kryptoklob
abstract contract WhitelistGated {
    /// @notice the address that can add addresses to the whitelist
    address public immutable whitelister;

    /// @param _whitelister the address that can add addresses to the whitelist
    constructor(address _whitelister) {
        whitelister = _whitelister;
    }

    /// @notice mapping of addresses to their whitelisted status
    mapping(address => bool) public isWhitelisted;

    /// @notice modifier that can be used to gate msg.sender from caling a function if they are not whitelisted
    modifier gated() {
        require(isWhitelisted[msg.sender], "Not whitelisted");
        _;
    }

    /// @notice adds someone to the whitelist; can only be called by the whitelister
    /// @param person the address to whitelist
    function whitelist(address person) external {
        require(msg.sender == whitelister, "Not whitelister");
        isWhitelisted[person] = true;
    }
}
