// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {Constants} from "../../../Constants.sol";
import "forge-std/Test.sol";

contract RariMerkleRedeemerIntegrationTest is Test {}
