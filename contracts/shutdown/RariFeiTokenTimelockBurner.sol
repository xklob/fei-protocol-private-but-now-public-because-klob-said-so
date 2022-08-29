// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Fei} from "../fei/Fei.sol";
import {LinearTokenTimelock} from "../timelocks/LinearTokenTimelock.sol";

/// @notice Accept the beneficiary of the Rari Fei token timelock. Permissionlessly
///         burn any Fei held on this contract
contract RariFeiTokenTimelockBurner {
    /// @notice Rari Infra team Fei token timelock
    LinearTokenTimelock public constant TIMELOCK = LinearTokenTimelock(0xfaFC562265a49975E8B20707EAC966473795CF90);

    /// @notice Fei ERC20 token
    Fei private constant FEI = Fei(0x956F47F50A910163D8BF957Cf5846D573E7f87CA);

    /// @notice Accept the beneficiary of the target timelock
    function acceptBeneficiary() external {
        TIMELOCK.acceptBeneficiary();
    }

    /// @notice Burn all FEI held by the Fei token timelock
    function burnFeiHeld() external {
        TIMELOCK.releaseMax(address(this));
        uint256 feiBalance = FEI.balanceOf(address(this));

        if (feiBalance != 0) {
            FEI.burn(feiBalance);
        }
    }
}
