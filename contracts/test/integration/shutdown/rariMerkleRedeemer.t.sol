// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {RariMerkleRedeemer} from "../../../shutdown/RariMerkleRedeemer.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {Constants} from "../../../Constants.sol";
import {Test} from "../../libs/forge-standard/src/Test.sol";

library RariMerkleRedeemerLib {
    // note: this is just for testing, do not actually use/import
    function getCTokens() public pure returns (address[] memory cTokens) {
        cTokens = new address[](27);

        // @todo: add comments for each one showing which pool and token each address represents
        cTokens[0] = address("0xd8552752f8868C1Ef160eEdf031cF0BCf9686945");
        cTokens[1] = address("0xbB025D470162CC5eA24daF7d4566064EE7f5F111");
        cTokens[2] = address("0x7e9cE3CAa9910cc048590801e64174957Ed41d43");
        cTokens[3] = address("0x647A36d421183a0a9Fa62717a64B664a24E469C7");
        cTokens[4] = address("0xFA1057d02A0C1a4885851e3F4fD496Ee7D38F56e");
        cTokens[5] = address("0x8E4E0257A4759559B4B1AC087fe8d80c63f20D19");
        cTokens[6] = address("0x6f95d4d251053483f41c8718C30F4F3C404A8cf2");
        cTokens[7] = address("0x3E5C122Ffa75A9Fe16ec0c69F7E9149203EA1A5d");
        cTokens[8] = address("0x51fF03410a0dA915082Af444274C381bD1b4cDB1");
        cTokens[9] = address("0xB7FE5f277058b3f9eABf6e0655991f10924BFA54");
        cTokens[10] = address("0x9de558FCE4F289b305E38ABe2169b75C626c114e");
        cTokens[11] = address("0xda396c927e3e6BEf77A98f372CE431b49EdEc43D");
        cTokens[12] = address("0xF148cDEc066b94410d403aC5fe1bb17EC75c5851");
        cTokens[13] = address("0x0C402F06C11c6e6A6616C98868A855448d4CfE65");
        cTokens[14] = address("0x26267e41CeCa7C8E0f142754Af707336f27Fa051");
        cTokens[15] = address("0xEbE0d1cb6A0b8569929e062d67bfbC07608f0A47");
        cTokens[16] = address("0xe097783483D1b7527152eF8B150B99B9B2700c8d");
        cTokens[17] = address("0x8922C1147E141C055fdDfc0ED5a119f3378c8ef8");
        cTokens[18] = address("0x7DBC3aF9251756561Ce755fcC11c754184Af71F7");
        cTokens[19] = address("0x3a2804ec0Ff521374aF654D8D0daA1d1aE1ee900");
        cTokens[20] = address("0xA54c548d11792b3d26aD74F5f899e12CDfD64Fd6");
        cTokens[21] = address("0xA6C25548dF506d84Afd237225B5B34F2Feb1aa07");
        cTokens[22] = address("0xfbD8Aaf46Ab3C2732FA930e5B343cd67cEA5054C");
        cTokens[23] = address("0x001E407f497e024B9fb1CB93ef841F43D645CA4F");
        cTokens[24] = address("0x5CaDc2a04921213DE60B237688776e0F1A7155E6");
        cTokens[25] = address("0x88d2757eB6280CC084cA36e425d6BC52d0A04429");
        cTokens[26] = address("0xe92a3db67e4b6AC86114149F522644b34264f858");

        return cTokens;
    }

    // note: this is just for testing, do not actually use/import
    function getRates() public pure returns (uint256[] memory rates) {
        rates = new uint256[](27);

        rates[0] = 100 ether;
        rates[1] = 0.5 ether;
        rates[2] = 0.1 ether;

        // unsure if this is needed
        for (uint256 i = 3; i < 27; i++) {
            rates[i] = 1;
        }

        return rates;
    }

    // note: this is just for testing, do not actually use/import
    function getRoots() public pure returns (bytes32[] memory roots) {
        roots = new bytes32[](27);

        roots[0] = bytes32("0");
        roots[1] = bytes32("1");
        roots[2] = bytes32("2");

        // unsure if this is needed
        for (uint256 i = 3; i < 27; i++) {
            roots[i] = bytes32("0");
        }

        return roots;
    }
}

contract RariMerkleRedeemerIntegrationTest is Test {
    RariMerkleRedeemer redeemer;

    function setUp() public {
        // deploy the contract first
        redeemer = new RariMerkleRedeemer(
            MainnetAddresses.FEI,
            RariMerkleRedeemerLib.getCTokens(),
            RariMerkleRedeemerLib.getRates(),
            RariMerkleRedeemerLib.getRoots()
        );
    }

    function testHappyPath() public {
        require(true, "The universe has broken");
    }

    // @todo: test reverting on an invalid base token
    // @todo: test happy path
    // @todo: test approvals
    // @todo: test redeeming literally everything
    // @todo: test withdrawing leftover tokens
}
