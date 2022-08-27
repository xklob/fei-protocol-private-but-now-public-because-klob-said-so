// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Abstract contract for exchange a number of ERC20 tokens for specific base token, permissioned via Merkle root(s)
/// @notice This contract assumes that the users must sign a message to redeem tokens
/// @author kryptoklob
abstract contract MultiMerkleRedeemer {
    /** ---------- Events ----------------------- **/

    /// @notice Emitted when a user signs for the first time; should only be emitted once per user
    /// @param signer the person singing; msg.sender
    /// @param signature the signed message hash
    event Signed(address indexed signer, bytes signature);

    /// @notice Emitted when a user completes a claim on a cToken; should only be emitted once per user per cToken at most
    /// @param claimant the person claiming; msg.sender
    /// @param cToken the cToken being claimed on
    /// @param claimAmount the amount the user says he has claim to; verified by Merkle root
    event Claimed(address indexed claimant, address indexed cToken, uint256 claimAmount);

    /// @notice Emitted when a user exchanges an amount of cTokens for the base token; can happen any number of times per user & cToken
    /// @param recipient the user; msg.sender
    /// @param cToken the cToken being exchange for the baseToken
    /// @param cTokenAmount the amount of cTokens being exchanged
    /// @param baseTokenAmount the amount of baseTokens being received
    event Redeemed(address indexed recipient, address indexed cToken, uint256 cTokenAmount, uint256 baseTokenAmount);

    /** ---------- Storage / Configuration ------ **/

    /// @notice The address of the token that will be exchange for cTokens
    address public baseToken;

    /// @notice The merkle roots that permission users to claim cTokens; one root per cToken
    mapping(address => bytes32) public merkleRoots;

    /// @notice Exchange rate of the base asset per each cToken
    mapping(address => uint256) public cTokenExchangeRates;

    /// @notice Stores user signatures; one signature per user, can only be provided once
    mapping(address => bytes) public userSignatures;

    // Mapping of the ctokens remaining for each user, that they are able to send into this contract and withdraw the base token with
    // Initially all zero. When a user signs a claim and provides their merkle roots, these values are updated to the amounts specified in the merkle roots.
    //    (user addr) => ((ctoken addr) => (ctoken remaining))

    /// @notice The amount of cTokens a user has redeemed, indexed first by user address, then by cToken address
    /// @dev This value starts at zero and can only increase
    mapping(address => mapping(address => uint256)) public redemptions;

    /// @notice The amount of cTokens a user in their claim, total; indexed first by user address, then by cToken address
    /// @dev This value is set when a user proves their claim on a particular cToken, and cannot change once set
    mapping(address => mapping(address => uint256)) public claims;

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
