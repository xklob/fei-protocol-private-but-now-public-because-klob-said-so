// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";

contract RariMerkleRedeemer is MultiMerkleRedeemer {

    constructor(
        address baseToken,
        address[] calldata cTokens,
        uint256[] calldata rates,
        bytes32[] calldata roots
    ) {
        _configureExchangeRates(cTokens, rates);
        _configureMerkleRoots(cTokens, roots);
        _configureBaseToken(baseToken);
    }

    /** ---------- Internal Funcs --------------- **/

    function _configureExchangeRates(address[] calldata _cTokens, uint256[] calldata _exchangeRates) internal {
        require(_cTokens.length == 27);
        require(_cTokens.length == _exchangeRates.length, "Exchange rates must be provided for each ctoken");

        for (uint256 i=0; i < _cTokens.length; i++) {
            require(_exchangeRates[i] > 0, "Exchange rate must be greater than 0");
            cTokenExchangeRates[_cTokens[i]] = _exchangeRates[i];
        }
    }

    function _configureMerkleRoots(address[] calldata _cTokens, bytes32[] calldata _roots) internal {
        require(_cTokens.length == 27);
        require(_cTokens.length == _roots.length, "Merkle roots must be provided for each ctoken");

        for (uint256 i=0; i < _cTokens.length; i++) {
            require(_roots[i] != bytes32(0), "Merkle root must be non-zero");
            merkleRoots[_cTokens[i]] = _roots[i];
        }
    }

    function _configureBaseToken(address _baseToken) internal {
        baseToken = _baseToken;
    }

    // User provides signature, which is checked against their address and the string constant "message"
    function _sign(bytes calldata signature) internal {

    }

    // User provides the the ctoken & the amount they should get, and it is verified against the merkle root for that ctoken
    function _claim(
        address cToken,
        uint256 amount,
        bytes32 merkleProof
    ) internal {

    }

    // User provides the ctokens & the amounts they should get, and it is verified against the merkle root for that ctoken (for each ctoken provided)
    function _multiClaim(
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[] memory merkleProofs
    ) internal {
        
    }
}