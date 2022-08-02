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

    /** ---------- Public Funcs ----------------- **/

    // User redeems amount of provided ctoken for the equivalent amount of the base token.
    // Decrements their available ctoken balance available to redeem with (redeemableTokensRemaining)
    // User must have approved the ctokens to this contract
    function redeem(address cToken, uint256 amount) external {
        // check: verify that the user's claimedAmount+amount of this ctoken doesn't exceed claimableAmount for this ctoken
        // effect: increment the user's claimedAmount
        // interaction: safeTransferFrom the user "amount" of "ctoken" to this contract

        revert("Not implemented");
    }

    function redeem(address[] calldata cTokens, uint256[] calldata amounts) external {
        revert("Not implemented");
    }

    // View how many base tokens a user could get for redeeming a particular amount of a ctoken
    function previewRedeem(
        address cToken,
        uint256 amount
    ) external returns (uint256 baseTokenAmount) {
        return cTokenExchangeRates[cToken] * amount;
    }

    // Optional function to combine sign, claim, and redeem into one call
    // User must have approved the ctokens to this contract
    function signAndClaimAndRedeem(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[] memory merkleProofs
    ) external {
        revert("Not implemented");
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
        require(_baseToken != address(0), "Base token must be non-zero");
        baseToken = _baseToken;
    }

    // User provides signature, which is checked against their address and the string constant "message"
    function _sign(bytes calldata _signature) internal {
        // check: to ensure the signature is a valid signature for the constant message string from msg.sender
        // effect: update user's stored signature

        revert("Not implemented");
    }

    // User provides the the ctoken & the amount they should get, and it is verified against the merkle root for that ctoken
    function _claim(
        address _cToken,
        uint256 _amount,
        bytes32 _merkleProof
    ) internal {
        // check: verify that claimableAmount is zero, revert if not
        // check: verify ctoken and amount and msg.sender against merkle root
        // effect: update cliaimableAmount for the user

        revert("Not implemented");
    }

    // User provides the ctokens & the amounts they should get, and it is verified against the merkle root for that ctoken (for each ctoken provided)
    function _multiClaim(
        address[] calldata _cTokens,
        uint256[] calldata _amounts,
        bytes32[] memory _merkleProofs
    ) internal {
        require(_cTokens.length == _amounts.length, "Number of ctokens and amounts must match");
        require(_cTokens.length == merkleProofs.length, "Number of ctokens and merkle proofs must match");

        for (uint256 i=0; i < _cTokens.length; i++) {
            _claim(_cTokens[i], _amounts[i], _merkleProofs[i]);
        }
    }
}