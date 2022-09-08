// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;

import {ERC20Dripper} from "../../pcv/utils/ERC20Dripper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Drips ERC20 tokens to the RariMerkleRedeemer contract
/// @author kryptoklob
contract MerkleRedeemerDripper is ERC20Dripper {
    constructor(
        address _core,
        address _target,
        uint256 _dripPeriod,
        uint256 _amountToDrip,
        address _token
    ) ERC20Dripper(_core, _target, _dripPeriod, _amountToDrip, _token) {}

    /// @notice Overrides drip() in the ERC20Dripper contract to add a balance check on the target
    function drip() external override afterTime whenNotPaused {
        require(
            IERC20(token).balanceOf(target) < amountToDrip,
            "MerkleRedeemerDripper: dripper target already has enough tokens."
        );

        // reset timer
        _initTimed();

        // drip amountToDrip if we have that much, otherwise drip the entire balance
        if (balance() >= amountToDrip) {
            _withdrawERC20(token, target, amountToDrip);
        } else {
            _withdrawERC20(token, target, balance());
        }

        emit Dripped(amountToDrip);
    }
}
