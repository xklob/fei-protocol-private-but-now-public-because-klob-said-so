// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {TimelockedDelegator} from "./TimelockedDelegator.sol";

/// @title Multi party timelocked delegator
/// @notice Timelocked delegator that allows one party to claim vesting TRIBE and another
///         to manage delegations
contract MultiPartyTimelockedDelegator is TimelockedDelegator {
    event SetDelegationManager(address indexed _oldDelegationManager, address indexed _newDelegationManager);

    /// @notice Manager giving out delegations
    address public delegationManager;

    constructor(
        address _tribe,
        address _beneficiary,
        uint256 _duration,
        address _delegationManager
    ) TimelockedDelegator(_tribe, _beneficiary, _duration) {
        delegationManager = _delegationManager;
    }

    modifier onlyDelegationManagerOrBeneficiary() {
        require(
            msg.sender == delegationManager || msg.sender == beneficiary,
            "Timelock: Caller not delegation manager or beneficiary"
        );
        _;
    }

    /// @notice Set a new delegation manager, permissioned to the beneficiary
    function setDelegationManager(address _newDelegationManager) external onlyBeneficiary {
        address oldDelegationManager = delegationManager;

        // Set new delegation manager in storage
        delegationManager = _newDelegationManager;
        emit SetDelegationManager(oldDelegationManager, _newDelegationManager);
    }

    /// @notice Pass through delegate method, permissioned to the delegate manager or beneficiary
    function delegate(address delegatee, uint256 amount) public override onlyDelegationManagerOrBeneficiary {
        super.delegate(delegatee, amount);
    }

    /// @notice Pass through undelegate method, permissioned to the delegation manager or beneficiary
    function undelegate(address delegatee) public override onlyDelegationManagerOrBeneficiary returns (uint256) {
        return super.undelegate(delegatee);
    }
}
