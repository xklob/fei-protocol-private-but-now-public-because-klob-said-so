// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface IPodFactory {
    /// @notice Configuration used when creating a pod
    /// @param members List of members to be added to the pod
    /// @param threshold Number of members that need to approve a transaction on the Gnosis safe
    /// @param label Metadata, Human readable label for the pod
    /// @param ensString Metadata, ENS name of the pod
    /// @param imageUrl Metadata, URL to a image to represent the pod in frontends
    /// @param admin The admin of the pod - able to add and remove pod members
    /// @param minDelay Delay on the timelock
    /// @param vetoController A controller through which a pod can be vetoed
    struct PodConfig {
        address[] members;
        uint256 threshold;
        bytes32 label;
        string ensString;
        string imageUrl;
        address admin;
        uint256 minDelay;
        address vetoController;
    }

    function getPodSafe(uint256 podId) external view returns (address);

    function getPodTimelock(uint256 podId) external view returns (address);

    function getNumMembers(uint256 podId) external view returns (uint256);

    function getPodMembers(uint256 podId)
        external
        view
        returns (address[] memory);

    function getPodThreshold(uint256 podId) external view returns (uint256);

    function getNextPodId() external view returns (uint256);

    function getPodAdmin(uint256 podId) external view returns (address);

    function createChildOptimisticPod(PodConfig calldata _config)
        external
        returns (uint256, address);

    function updatePodController(address newPodController) external;

    function burnerCreateChildOptimisticPods(PodConfig[] calldata _config)
        external
        returns (uint256[] memory, address[] memory);
}