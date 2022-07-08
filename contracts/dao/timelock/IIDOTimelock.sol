// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Decimal} from "../../external/Decimal.sol";

/// @title IDO interface
/// @author Fei Protocol
interface IIDOInterface {
    // ----------- Events -----------

    event Deploy(uint256 _amountFei, uint256 _amountTribe);

    // ----------- Read only API -------------
    function beneficiary() external returns (address);

    // ----------- Beneficiary state changing API  -------------
    function setPendingBeneficiary(address) external;

    function pendingBeneficiary(address) external;

    function acceptBeneficiary() external;

    // ----------- Genesis Group only state changing API -----------

    function deploy(Decimal.D256 calldata feiRatio) external;

    function swapFei(uint256 amountFei) external returns (uint256);

    // ----------- Governor only state changing API -----------

    function unlockLiquidity() external;
}
