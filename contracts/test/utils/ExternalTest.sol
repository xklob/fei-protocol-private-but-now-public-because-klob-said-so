// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libs/forge-standard/src/Test.sol";

contract ExternalTest is Test {
    function getTokens(
        address token,
        address to,
        uint256 give
    ) external {
        require(isContract(address(vm)), "VM contract has zero size!");
        deal(token, to, give, true);
    }

    function isContract(address _addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}
