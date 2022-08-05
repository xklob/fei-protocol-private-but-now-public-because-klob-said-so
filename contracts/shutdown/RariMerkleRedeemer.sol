// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "./MerkleRedeemer.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RariMerkleRedeemer is MultiMerkleRedeemer {
    address public immutable override baseToken;
    using SafeERC20 for IERC20;

    constructor(
        address core,
        address token,
        address[] memory cTokens,
        uint256[] memory rates,
        bytes32[] memory roots
    ) CoreRef(core) {
        _configureExchangeRates(cTokens, rates);
        _configureMerkleRoots(cTokens, roots);
        _configureBaseToken(token);
    }

    /** ---------- Public Funcs ----------------- **/

    // User redeems amount of provided ctoken for the equivalent amount of the base token.
    // Decrements their available ctoken balance available to redeem with (redeemableTokensRemaining)
    // User must have approved the ctokens to this contract
    function redeem(address cToken, uint256 amount) external override {
        // check: verify that the user's claimedAmount+amount of this ctoken doesn't exceed claimableAmount for this ctoken
        require(
            claimedAmounts[msg.sender][cToken] + amount <= claimableAmounts[msg.sender][cToken],
            "Amount exceeds available remaining claim."
        );

        // effect: increment the user's claimedAmount
        claimedAmounts[msg.sender][cToken] += amount;

        // interaction: safeTransferFrom the user "amount" of "ctoken" to this contract

        revert("Not implemented");
    }

    function redeem(address[] calldata cTokens, uint256[] calldata amounts) external override {
        // check : ctokens.length must equal amounts.length
        // check : amount isn't zero
        // check : amount is less than or equal to the user's claimableAmount-claimedAmount for this ctoken

        for (uint256 i = 0; i < cTokens.length; i++) {
            require(cTokens[i] != address(0), "Invalid ctoken address");
            require(amounts[i] != 0, "Invalid amount");
            require(
                amounts[i] <= claimableAmounts[msg.sender][cTokens[i]] - claimedAmounts[msg.sender][cTokens[i]],
                "Amount exceeds available remaining claim."
            );

            // effect: increment the user's claimedAmount
            claimedAmounts[msg.sender][cTokens[i]] += amounts[i];
        }

        // We give the interactions (the safeTransferFroms) their own foor loop, juuuuust to be safe
        for (uint256 i = 0; i < cTokens.length; i++) {
            IERC20(cTokens[i]).safeTransferFrom(msg.sender, address(this), amounts[i]);
        }

        revert("Not implemented");
    }

    // View how many base tokens a user could get for redeeming a particular amount of a ctoken
    function previewRedeem(address cToken, uint256 amount) external override returns (uint256 baseTokenAmount) {
        return cTokenExchangeRates[cToken] * amount;
    }

    // User provides signature of acknowledged message, and all of the ctokens, amounts, and merkleproofs for their claimable tokens.
    // This will set each user's balances in redeemableTokensRemaining according to the data verified by the merkle proofs
    // Can only be called once per user. See _sign, _claim, and _multiClaim below.
    function signAndClaim(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[] memory merkleProofs
    ) external override {
        revert("Not implemented");
    }

    // Optional function to combine sign, claim, and redeem into one call
    // User must have approved the ctokens to this contract
    function signAndClaimAndRedeem(
        bytes calldata signature,
        address[] calldata cTokens,
        uint256[] calldata amounts,
        bytes32[] memory merkleProofs
    ) external override {
        revert("Not implemented");
    }

    /** ---------- Internal Funcs --------------- **/

    function _configureExchangeRates(address[] memory _cTokens, uint256[] memory _exchangeRates) internal {
        require(_cTokens.length == 27);
        require(_cTokens.length == _exchangeRates.length, "Exchange rates must be provided for each ctoken");

        for (uint256 i = 0; i < _cTokens.length; i++) {
            require(_exchangeRates[i] > 0, "Exchange rate must be greater than 0");
            cTokenExchangeRates[_cTokens[i]] = _exchangeRates[i];
        }
    }

    function _configureMerkleRoots(address[] memory _cTokens, bytes32[] memory _roots) internal {
        require(_cTokens.length == 27);
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
    function _sign(bytes calldata _signature) internal override {
        // check: to ensure the signature is a valid signature for the constant message string from msg.sender
        // effect: update user's stored signature

        revert("Not implemented");
    }

    // User provides the the ctoken & the amount they should get, and it is verified against the merkle root for that ctoken
    function _claim(
        address _cToken,
        uint256 _amount,
        bytes32 _merkleProof
    ) internal override {
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
    ) internal override {
        require(_cTokens.length == _amounts.length, "Number of ctokens and amounts must match");
        require(_cTokens.length == _merkleProofs.length, "Number of ctokens and merkle proofs must match");

        for (uint256 i = 0; i < _cTokens.length; i++) {
            _claim(_cTokens[i], _amounts[i], _merkleProofs[i]);
        }
    }
}
