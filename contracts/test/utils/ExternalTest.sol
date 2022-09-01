// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import "../libs/forge-standard/src/Test.sol";

// Wrappers around Cheatcodes to avoid footguns
contract ExternalTest is Test {
    function getTokens(
        address token,
        address to,
        uint256 give
    ) external {
        deal(token, to, give);
    }
}
