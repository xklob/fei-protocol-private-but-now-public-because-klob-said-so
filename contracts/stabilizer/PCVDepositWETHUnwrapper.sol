pragma solidity ^0.8.0;

import "../Constants.sol";
import "./../pcv/PCVDeposit.sol";

/// @notice contract to unwrap WETH into eth and then send that eth to a PCV deposit 
contract PCVDepositWETHUnwrapper {

    /// @notice the PCV deposit target
    IPCVDeposit public immutable surplusTarget;

    constructor (IPCVDeposit _surplusTarget) {
        surplusTarget = _surplusTarget;
    }

    function deposit() external {
        Constants.WETH.withdraw(address(this).balance);
        (bool success, ) = address(surplusTarget).call{value: address(this).balance}("");
        require(success, "PCVDepositWETHUnwrapper: eth deposit failed");
        surplusTarget.deposit();
    }

    receive() payable external {}
}
