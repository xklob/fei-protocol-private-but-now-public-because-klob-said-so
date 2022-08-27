// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

abstract contract MultiMerkleRedeemer {
    /** ---------- Events ----------------------- **/

    event Signed(address indexed signer, bytes signature);
    event Claimed(address indexed signer, address indexed cToken, uint256 claimAmount);
    event Redeemed(address indexed recipient, address indexed cToken, uint256 cTokenAmount, uint256 baseTokenAmount);

    /** ---------- Storage / Configuration ------ **/

    // The token we're going to give out when a user redeems.
    // (Immutable in derived contract)
    address public baseToken;

    // One merkle root per ctoken
    mapping(address => bytes32) public merkleRoots;

    // Exchange rate of the base asset per each ctoken
    mapping(address => uint256) public cTokenExchangeRates;

    // One signature per user
    mapping(address => bytes) public userSignatures;

    // Mapping of the ctokens remaining for each user, that they are able to send into this contract and withdraw the base token with
    // Initially all zero. When a user signs a claim and provides their merkle roots, these values are updated to the amounts specified in the merkle roots.
    //    (user addr) => ((ctoken addr) => (ctoken remaining))
    mapping(address => mapping(address => uint256)) public currentClaimedAmounts;
    mapping(address => mapping(address => uint256)) public maximumClaimableAmounts;

    // The message that the user will sign
    string public constant MESSAGE = "Sample message, please update.";
    bytes32 public MESSAGE_HASH = ECDSA.toEthSignedMessageHash(bytes(MESSAGE));

    // The leaf structure for the merkle tree
    // This gets hashed into a bytes32 for proving existence in the tree
    struct Leaf {
        address user;
        uint256 amount;
    }

    /** ---------- Public Funcs ----------------- **/

    function sign(bytes calldata _signature) external virtual;

    // A pass-through to the internal _claim function
    // If user has already claimed for this cToken, this will revert
    // _amount must be the full amount supported by the merkle proof, else this will revert
    function claim(
        address _cToken,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external virtual;

    // An overloaded version of claim that supports multiple tokekns
    function multiClaim(
        address[] calldata _cTokens,
        uint256[] calldata _amounts,
        bytes32[][] calldata _merkleProofs
    ) external virtual;

    // User redeems amount of provided ctoken for the equivalent amount of the base token.
    // Decrements their available ctoken balance available to redeem with (redeemableTokensRemaining)
    // User must have approved the ctokens to this contract
    function redeem(address cToken, uint256 amount) external virtual;

    function multiRedeem(address[] calldata cTokens, uint256[] calldata amounts) external virtual;

    // User provides signature of acknowledged message, and all of the ctokens, amounts, and merkleproofs for their claimable tokens.
    // This will set each user's balances in redeemableTokensRemaining according to the data verified by the merkle proofs
    // Can only be called once per user. See _sign, _claim, and _multiClaim below.
    function signAndClaim(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) external virtual;

    // View how many base tokens a user could get for redeeming a particular amount of a ctoken
    function previewRedeem(address cToken, uint256 amount) external virtual returns (uint256 baseTokenAmount);

    // Optional function to combine sign, claim, and redeem into one call
    // User must have approved the ctokens to this contract
    function signAndClaimAndRedeem(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amountsToClaim,
        uint256[] calldata amountsToRedeem,
        bytes32[][] calldata merkleProofs
    ) external virtual;

    /** ---------- Internal Funcs --------------- **/

    // User provides signature, which is checked against their address and the string constant "message"
    function _sign(bytes calldata signature) internal virtual;

    // User provides the the ctoken & the amount they should get, and it is verified against the merkle root for that ctoken
    function _claim(
        address cToken,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) internal virtual;

    // User provides the ctokens & the amounts they should get, and it is verified against the merkle root for that ctoken (for each ctoken provided)
    function _multiClaim(
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) internal virtual;

    function _redeem(address cToken, uint256 amount) internal virtual;

    function _multiRedeem(address[] calldata cTokens, uint256[] calldata amount) internal virtual;
}
