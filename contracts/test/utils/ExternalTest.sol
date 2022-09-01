// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

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
