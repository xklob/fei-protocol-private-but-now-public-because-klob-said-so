import {DSTest} from "../../utils/DSTest.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {IDOLiquidityRemover} from "../../../utils/IDOLiquidityRemover.sol";

contract IDORemoverIntegrationTest is DSTest {
    IDOLiquidityRemover idoRemover;
    address feiReceiver = address(1);
    address tribeReceiver = address(2);

    function setUp() public {
        idoRemover = new IDOLiquidityRemover(MainnetAddresses.CORE, feiReceiver, tribeReceiver);
    }

    function testInitialState() public {
        assertEq(idoRemover.feiTo(), feiReceiver);
        assertEq(idoRemover.tribeTo(), tribeReceiver);
        assertEq(address(idoRemover.FEI()), MainnetAddresses.FEI);
        assertEq(address(idoRemover.TRIBE()), MainnetAddresses.FEI);
    }

    /// @notice Validate LP tokens can be redeemed for underlying, and underlying FEI and TRIBE
    ///         can be sent to destinations
    function testRedeemLiquidity() public {}
}
