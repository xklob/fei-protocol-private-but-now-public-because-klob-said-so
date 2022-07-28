// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title contract used to redeem a list of tokens, by permanently
/// taking another token out of circulation.
/// @author Fei Protocol
contract Redeemer is CoreRef {
    using SafeERC20 for IERC20;

    /// @notice event to track redemptions
    event Redeemed(address indexed owner, address indexed receiver, uint256 amount, uint256 base);

    /// @notice token to redeem
    address public immutable redeemedToken;

    /// @notice true of redemptions are active
    bool public active; // = false on deploy

    /// @notice tokens to receive when redeeming
    address[] private tokensReceived;

    /// @notice base used to compute the redemption amounts.
    /// For instance, if the base is 100, and a user provides 100 `redeemedToken`,
    /// they will receveive all the balance of `tokensReceived` held on this contract.
    uint256 public redeemBase = type(uint256).max;

    constructor(address core, address token) CoreRef(core) {
        redeemedToken = token;
    }

    /// @notice Public function to get `tokensReceived`
    function tokensReceivedOnRedeem() public view returns (address[] memory) {
        return tokensReceived;
    }

    /// @notice Configure and activate redemptions
    function configureRedemption(address[] memory _tokensReceived, uint256 _redeemBase) external onlyGovernor {
        require(!active, "Already configured");
        tokensReceived = _tokensReceived;
        redeemBase = _redeemBase;
        active = true;
    }

    /// @notice Return the balances of `tokensReceived` that would be
    /// transferred if redeeming `amount` of `redeemedToken`.
    function previewRedeem(uint256 amount) public view returns (address[] memory tokens, uint256[] memory amounts) {
        tokens = tokensReceivedOnRedeem();
        amounts = new uint256[](tokens.length);

        uint256 base = redeemBase;
        for (uint256 i = 0; i < tokensReceived.length; i++) {
            uint256 balance = IERC20(tokensReceived[i]).balanceOf(address(this));
            // @dev, this assumes all of `tokensReceived` and `redeemedToken`
            // have the same number of decimals
            uint256 redeemedAmount = (amount * balance) / base;
            amounts[i] = redeemedAmount;
        }
    }

    /// @notice Redeem `redeemedToken` for a pro-rata basket of `tokensReceived`
    function redeem(address to, uint256 amount) external {
        require(active, "Redemptions not started");
        IERC20(redeemedToken).safeTransferFrom(msg.sender, address(this), amount);

        (address[] memory tokens, uint256[] memory amounts) = previewRedeem(amount);

        uint256 base = redeemBase;
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).safeTransfer(to, amounts[i]);
        }

        emit Redeemed(msg.sender, to, amount, base);
    }

    /// @notice withdraw ERC20 from the contract
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyPCVController {
        // cannot withdraw after redemptions are enabled
        require(!active, "Redemptions started");

        // perform transfer
        IERC20(token).safeTransfer(to, amount);
    }
}
