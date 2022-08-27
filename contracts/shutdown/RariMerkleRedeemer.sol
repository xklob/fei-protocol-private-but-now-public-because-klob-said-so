// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "./MultiMerkleRedeemer.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RariMerkleRedeemer is MultiMerkleRedeemer, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Helpful modifiers

    modifier hasSigned() {
        require(keccak256(userSignatures[msg.sender]) != keccak256(userSignatures[address(0)]), "User has not signed.");
        _;
    }

    modifier hasNotSigned() {
        require(
            keccak256(userSignatures[msg.sender]) == keccak256(userSignatures[address(0)]),
            "User has already signed"
        );
        _;
    }

    constructor(
        address token,
        address[] memory cTokens,
        uint256[] memory rates,
        bytes32[] memory roots
    ) {
        _configureExchangeRates(cTokens, rates);
        _configureMerkleRoots(cTokens, roots);
        _configureBaseToken(token);
    }

    // @todo - natspec
    // @todo - verify that having zero as a default value doesn't mess up any signatures or proofs

    /** ---------- Public Funcs ----------------- **/

    // A pass-through to the internal _sign function.
    // Can only be called once; reverts if already successfully executed
    // or if signature is invalid
    function sign(bytes calldata signature) external override hasNotSigned nonReentrant {
        _sign(signature);
    }

    // A pass-through to the internal _claim function
    // If user has already claimed for this cToken, this will revert
    // _amount must be the full amount supported by the merkle proof, else this will revert
    function claim(
        address _cToken,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external override hasSigned nonReentrant {
        _claim(_cToken, _amount, _merkleProof);
    }

    // An overloaded version of claim that supports multiple tokekns
    function multiClaim(
        address[] calldata _cTokens,
        uint256[] calldata _amounts,
        bytes32[][] calldata _merkleProofs
    ) external override hasSigned nonReentrant {
        _multiClaim(_cTokens, _amounts, _merkleProofs);
    }

    // User redeems amount of provided ctoken for the equivalent amount of the base token.
    // Decrements their available ctoken balance available to redeem with (redeemableTokensRemaining)
    // User must have approved the ctokens to this contract
    function redeem(address cToken, uint256 amount) external override hasSigned nonReentrant {
        _redeem(cToken, amount);
    }

    // Overloaded version of redeem that supports multiple cTokens
    function multiRedeem(address[] calldata cTokens, uint256[] calldata amounts)
        external
        override
        hasSigned
        nonReentrant
    {
        _multiRedeem(cTokens, amounts);
    }

    // View how many base tokens a user could get for redeeming a particular amount of a ctoken
    function previewRedeem(address cToken, uint256 amount) public view override returns (uint256 baseTokenAmount) {
        return cTokenExchangeRates[cToken] * amount;
    }

    // ---------- Public Helpers ---------- //
    // Below here are helpers that combine the above public functions in useful ways.
    // Which ones are called should be decided by a frontend; the optimal route is signAndClaimAndRedeem,
    // but this obviously requires the user to have enough cTokens (+ approvals on them) for all cTokens he or she is entitled to.
    // If these requirements are not fully met, we can still use signAndClaim, and then the single or multi-redeem call above to
    // redeem exactly as much as the user would like to of each cToken.

    // User provides signature of acknowledged message, and all of the ctokens, amounts, and merkleproofs for their claimable tokens.
    // This will set each user's balances in redeemableTokensRemaining according to the data verified by the merkle proofs
    // Can only be called once per user. See _sign, _claim, and _multiClaim below.
    function signAndClaim(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) external override nonReentrant {
        // both sign and claim/multiclaim will revert on invalid signatures/proofs
        _sign(signature);
        _multiClaim(cTokens, amounts, merkleProofs);
    }

    // Combines claiming & redeeming into one function
    // Requires that the user has already successfully signed
    function claimAndRedeem(
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) external hasSigned nonReentrant {
        _multiClaim(cTokens, amounts, merkleProofs);
        _multiRedeem(cTokens, amounts);
    }

    // Optional function to combine sign, claim, and redeem into one call
    // User must have approved the ctokens to this contract
    function signAndClaimAndRedeem(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amountsToClaim,
        uint256[] calldata amountsToRedeem,
        bytes32[][] calldata merkleProofs
    ) external override nonReentrant {
        _sign(signature);
        _multiClaim(cTokens, amountsToClaim, merkleProofs);
        _multiRedeem(cTokens, amountsToRedeem);
    }

    /** ---------- Internal Funcs --------------- **/

    function _configureExchangeRates(address[] memory _cTokens, uint256[] memory _exchangeRates) internal {
        require(_cTokens.length == 27, "Must provide exactly 27 exchange rates.");
        require(_cTokens.length == _exchangeRates.length, "Exchange rates must be provided for each ctoken");

        for (uint256 i = 0; i < _cTokens.length; i++) {
            require(_exchangeRates[i] > 0, "Exchange rate must be greater than 0");
            cTokenExchangeRates[_cTokens[i]] = _exchangeRates[i];
        }
    }

    function _configureMerkleRoots(address[] memory _cTokens, bytes32[] memory _roots) internal {
        require(_cTokens.length == 27, "Must provide exactly 27 merkle roots");
        require(_cTokens.length == _roots.length, "Merkle roots must be provided for each ctoken");

        for (uint256 i = 0; i < _cTokens.length; i++) {
            require(_roots[i] != bytes32(0), "Merkle root must be non-zero");
            merkleRoots[_cTokens[i]] = _roots[i];
        }
    }

    function _configureBaseToken(address _baseToken) internal {
        require(_baseToken != address(0), "Base token must be non-zero");
        baseToken = _baseToken;
    }

    // User provides signature, which is checked against their address and the string constant "message"
    function _sign(bytes calldata _signature) internal virtual override {
        // check: to ensure the signature is a valid signature for the constant message string from msg.sender
        require(ECDSA.recover(MESSAGE_HASH, _signature) == msg.sender, "Signature not valid");

        // effect: update user's stored signature
        userSignatures[msg.sender] = _signature;

        emit Signed(msg.sender, _signature);
    }

    // User provides the the ctoken & the amount they should get, and it is verified against the merkle root for that ctoken
    function _claim(
        address _cToken,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) internal virtual override {
        // check: verify that claimableAmount is zero, revert if not
        require(maximumClaimableAmounts[msg.sender][_cToken] == 0, "User has already claimed for this cToken.");

        // check: verify ctoken and amount and msg.sender against merkle root
        // @todo - ensure that we're using the correct encoding for the leaf structure
        Leaf memory leaf = Leaf(msg.sender, _amount);
        bytes32 leafHash = keccak256(abi.encodePacked(leaf.user, leaf.amount));
        require(MerkleProof.verifyCalldata(_merkleProof, merkleRoots[_cToken], leafHash), "Merkle proof not valid.");

        // effect: update claimableAmount for the user
        maximumClaimableAmounts[msg.sender][_cToken] = _amount;

        emit Claimed(msg.sender, _cToken, _amount);
    }

    // User provides the ctokens & the amounts they should get, and it is verified against the merkle root for that ctoken (for each ctoken provided)
    function _multiClaim(
        address[] calldata _cTokens,
        uint256[] calldata _amounts,
        bytes32[][] calldata _merkleProofs
    ) internal virtual override {
        require(_cTokens.length == _amounts.length, "Number of ctokens and amounts must match");
        require(_cTokens.length == _merkleProofs.length, "Number of ctokens and merkle proofs must match");

        for (uint256 i = 0; i < _cTokens.length; i++) {
            _claim(_cTokens[i], _amounts[i], _merkleProofs[i]);
        }

        // no events needed here, they happen in _claim
    }

    function _redeem(address cToken, uint256 cTokenAmount) internal virtual override {
        // check: verify that the user's claimedAmount+amount of this ctoken doesn't exceed claimableAmount for this ctoken
        require(
            currentClaimedAmounts[msg.sender][cToken] + cTokenAmount <= maximumClaimableAmounts[msg.sender][cToken],
            "Amount exceeds available remaining claim."
        );

        // effect: increment the user's claimedAmount
        currentClaimedAmounts[msg.sender][cToken] += cTokenAmount;

        uint256 baseTokenAmountReceived = previewRedeem(cToken, cTokenAmount);

        // interaction: safeTransferFrom the user "amount" of "ctoken" to this contract
        IERC20(cToken).safeTransferFrom(msg.sender, address(this), cTokenAmount);
        IERC20(baseToken).safeTransfer(msg.sender, baseTokenAmountReceived);

        emit Redeemed(msg.sender, cToken, cTokenAmount, baseTokenAmountReceived);
    }

    function _multiRedeem(address[] calldata cTokens, uint256[] calldata cTokenAmounts) internal virtual override {
        // check : ctokens.length must equal amounts.length
        require(cTokens.length == cTokenAmounts.length, "Length of cTokens and amounts must match.");

        for (uint256 i = 0; i < cTokens.length; i++) {
            // check: cToken cannot be the zero address
            require(cTokens[i] != address(0), "Invalid ctoken address");

            // check: amount must be greater than 0
            require(cTokenAmounts[i] != 0, "Invalid amount");

            // check: amount is less than or equal to the user's claimableAmount-claimedAmount for this ctoken
            require(
                currentClaimedAmounts[msg.sender][cTokens[i]] + cTokenAmounts[i] <=
                    maximumClaimableAmounts[msg.sender][cTokens[i]],
                "Amount exceeds available remaining claim."
            );

            // effect: increment the user's claimedAmount
            currentClaimedAmounts[msg.sender][cTokens[i]] += cTokenAmounts[i];
        }

        // We give the interactions (the safeTransferFroms) their own for loop, juuuuust to be safe
        for (uint256 i = 0; i < cTokens.length; i++) {
            uint256 baseTokenAmountReceived = previewRedeem(cTokens[i], cTokenAmounts[i]);
            IERC20(cTokens[i]).safeTransferFrom(msg.sender, address(this), cTokenAmounts[i]);
            IERC20(baseToken).safeTransfer(msg.sender, baseTokenAmountReceived);
            emit Redeemed(msg.sender, cTokens[i], cTokenAmounts[i], baseTokenAmountReceived);
        }
    }
}
