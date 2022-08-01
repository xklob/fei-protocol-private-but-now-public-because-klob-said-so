// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";

abstract contract MultiMerkleRedeemer is CoreRef {
    /** ---------- Storage / Configuration ------ **/

    // The Token we're going to give out when a user redeems.
    address public baseToken;

    // One merkle root per ctoken
    mapping(address => bytes32) public merkleRoots;

    // One signature per user
    mapping(address => bytes32) public userSignatures;

    // Exchange rate of the base asset per each ctoken
    mapping(address => uint256) public cTokenExchangeRates;

    // Mapping of the ctokens remaining for each user, that they are able to send into this contract and withdraw the base token with
    // Initially all zero. When a user signs a claim and provides their merkle roots, these values are updated to the amounts specified in the merkle roots.
    //    (user addr) => ((ctoken addr) => (ctoken remaining))
    mapping(address => mapping(address => uint256)) public redeemableTokensRemaining;

    // Have the exchange rates been configured yet?
    bool public exchangeRatesConfigured;

    // Have the merkle roots been configured yet?
    bool public merkleRootsConfigured;

    // The message that the user will sign
    string private constant MESSAGE = "I solemly swear I am up to no good.";

    /** ---------- Permissioned Funcs ----------- **/

    // Governance actions that set the exchange rates & merkle roots & base token
    function configureExchangeRates(address[] calldata tokens, uint256[] calldata rates) external virtual;

    function configureMerkleRoots(bytes32[] calldata roots) external virtual;

    function configureBaseToken(address baseToken) external virtual;

    /** ---------- Public Funcs ----------------- **/

    // User provides signature of acknowledged message, and all of the ctokens, amounts, and merkleproofs for their claimable tokens.
    // This will set each user's balances in redeemableTokensRemaining according to the data verified by the merkle proofs
    // Can only be called once per user. See _sign, _claim, and _multiClaim below.
    function signAndClaim(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[] memory merkleProofs
    ) external virtual;

    // User redeems amount of provided ctoken for the equivalent amount of the base token.
    // Decrements their available ctoken balance available to redeem with (redeemableTokensRemaining)
    // User must have approved the ctokens to this contract
    function redeem(address cToken, uint256 amount) external virtual;

    function redeem(address[] calldata cTokens, uint256[] calldata amounts) external virtual;

    // View how many base tokens a user could get for redeem a particular amount of a ctoken
    function previewRedeem(
        address user,
        address cToken,
        uint256 amount
    ) external virtual returns (uint256 baseTokenAmount);

    // Optional function to combine sign, claim, and redeem into one call
    // User must have approved the ctokens to this contract
    function signAndClaimAndRedeem(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[] memory merkleProofs
    ) external virtual;

    /** ---------- Internal Funcs --------------- **/

    // User provides signature, which is checked against their address and the string constant "message"
    function _sign(bytes calldata signature) internal virtual;

    // User provides the the ctoken & the amount they should get, and it is verified against the merkle root for that ctoken
    function _claim(
        address cToken,
        uint256 amount,
        bytes32[] memory merkleProof
    ) internal virtual;

    // User provides the ctokens & the amounts they should get, and it is verified against the merkle root for that ctoken (for each ctoken provided)
    function _multiClaim(
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[] memory merkleProofs
    ) internal virtual;
}
