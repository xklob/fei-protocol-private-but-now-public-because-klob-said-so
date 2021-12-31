// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.10;

import "../../external/ERC20Vault.sol";
import "../../staking/ITribalChief.sol";

/// @title Yield Bearing Vault
/// @author joeysantoro
contract TribalChiefVault is ERC20Vault {

    ITribalChief public immutable tribalChief;
    uint256 public immutable pid;

    constructor(ITribalChief _tribalChief, ERC20 _underlying)
        ERC20Vault(
            _underlying,
            string(abi.encodePacked("TribalChief ", _underlying.name(), " Vault")),
            string(abi.encodePacked("tc", _underlying.symbol())),
        )
    {
        tribalChief = _tribalChief;

        uint256 len = _tribalChief.numPools();
        bool found;
        for (uint256 i = 0; i < len; i ++) {
            if (_tribalChief.stakedToken(i) == _underlying) {
                pid = i;
                found = true;
                break;
            }
        }
        require(found, "underlying not found");
    }
    
    function beforeWithdraw(uint256 underlyingAmount) internal override {
        tribalChief.withdrawFromDeposit(pid, underlyingAmount, address(this), 0);
    }

    function afterDeposit(uint256 underlyingAmount) internal override {
        tribalChief.withdrawAllAndHarvest(pid, address(this));

        uint256 balance = underlying.balanceOf(address(this));

        underlying.approve(address(_tribalChief), balance);
        
        tribalChief.deposit(balance);
    }

    /// @notice Calculates the total amount of underlying tokens the Vault holds.
    /// @return totalUnderlyingHeld The total amount of underlying tokens the Vault holds.
    function totalHoldings() public view override returns (uint256) {
        return tribalChief.getTotalStakedInPool(pid, address(this));
    }
}