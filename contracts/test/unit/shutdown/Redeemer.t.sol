pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {Redeemer} from "../../../shutdown/Redeemer.sol";
import {Core} from "../../../core/Core.sol";
import {MockERC20} from "../../../mock/MockERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";

contract RedeemerTest is DSTest {
    event Redeemed(address indexed owner, address indexed receiver, uint256 amount, uint256 base);

    Redeemer private redeemer;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses public addresses = getAddresses();

    MockERC20 private redeemToken;
    MockERC20 private token1;
    MockERC20 private token2;
    MockERC20 private token3;

    address payable owner = payable(address(42));

    function setUp() public {
        Core core = getCore();

        redeemToken = new MockERC20();
        redeemer = new Redeemer(address(core), address(redeemToken));

        token1 = new MockERC20();
        token2 = new MockERC20();
        token3 = new MockERC20();

        token1.mint(address(redeemer), 50000 ether); // 50k
        token2.mint(address(redeemer), 20000 ether); // 20k
        token3.mint(address(redeemer), 30000000 ether); // 30M
        redeemToken.mint(address(owner), 250000000 ether); // 250M
    }

    /// @notice Validate initiate state when deployed
    function testInitialState() public {
        assertEq(redeemer.redeemedToken(), address(redeemToken));
        assertEq(redeemer.redeemBase(), type(uint256).max);
        assertEq(redeemer.active(), false);
        assertEq(redeemer.tokensReceivedOnRedeem().length, 0);
    }

    ////////////////// configureRedemption() //////////////////////
    function testConfigureRedemptionRevertIfNotGovernor() public {
        // revert because caller is no governor
        vm.expectRevert(bytes("CoreRef: Caller is not a governor"));
        redeemer.configureRedemption(new address[](1), 10000);
    }

    function testConfigureRedemptionRevertIfAlreadyConfigured() public {
        // configure redemption & activate it
        vm.prank(addresses.governorAddress);
        redeemer.configureRedemption(new address[](1), 10000);

        // should fail after redemptions are active
        vm.expectRevert(bytes("Already configured"));
        vm.prank(addresses.governorAddress);
        redeemer.configureRedemption(new address[](1), 10000);
    }

    function testConfigureRedemption() public {
        // should configure tokens received and the base used to compute the redemption amounts
        address[] memory tokens = new address[](3);
        tokens[0] = address(token1);
        tokens[1] = address(token2);
        tokens[2] = address(token3);
        vm.prank(addresses.governorAddress);
        redeemer.configureRedemption(tokens, 10000);

        // check the contract state changed
        assertEq(redeemer.active(), true);
        assertEq(redeemer.redeemBase(), 10000);
        assertEq(redeemer.tokensReceivedOnRedeem()[0], address(token1));
        assertEq(redeemer.tokensReceivedOnRedeem()[1], address(token2));
        assertEq(redeemer.tokensReceivedOnRedeem()[2], address(token3));
    }

    ///////////////////// previewRedeem() /////////////////////////
    function testPreviewRedeem() public {
        // configure tokens received and the base used to compute the redemption amounts
        address[] memory tokens = new address[](3);
        tokens[0] = address(token1);
        tokens[1] = address(token2);
        tokens[2] = address(token3);
        vm.prank(addresses.governorAddress);
        redeemer.configureRedemption(tokens, 10000);

        (address[] memory tokensRedeemed, uint256[] memory amountsRedeemAll) = redeemer.previewRedeem(10000);

        assertEq(tokensRedeemed.length, 3);
        assertEq(tokensRedeemed[0], address(token1));
        assertEq(tokensRedeemed[1], address(token2));
        assertEq(tokensRedeemed[2], address(token3));
        assertEq(amountsRedeemAll.length, 3);
        assertEq(amountsRedeemAll[0], 50000 ether); // 50k
        assertEq(amountsRedeemAll[1], 20000 ether); // 20k
        assertEq(amountsRedeemAll[2], 30000000 ether); // 30M

        (, uint256[] memory amountsRedeemHalf) = redeemer.previewRedeem(5000);
        assertEq(amountsRedeemHalf[0], 25000 ether); // 25k
        assertEq(amountsRedeemHalf[1], 10000 ether); // 10k
        assertEq(amountsRedeemHalf[2], 15000000 ether); // 15M
    }

    //////////////////////// redeem() /////////////////////////////
    function testRevertIfNotActive() public {
        // revert because redemption is not active
        vm.expectRevert(bytes("Redemptions not started"));
        redeemer.redeem(address(this), 10000);
    }

    function testRedeemForSelf() public {
        // configure tokens received and the base used to compute the redemption amounts
        address[] memory tokens = new address[](3);
        tokens[0] = address(token1);
        tokens[1] = address(token2);
        tokens[2] = address(token3);
        vm.prank(addresses.governorAddress);
        redeemer.configureRedemption(tokens, 250000000 ether);

        // redeem for self
        vm.startPrank(owner);
        redeemToken.approve(address(redeemer), 250000000 ether);
        vm.expectEmit(true, true, true, true);
        emit Redeemed(owner, owner, 250000000 ether, 250000000 ether);
        redeemer.redeem(owner, 250000000 ether);
        vm.stopPrank();

        // check tokens spent & received by the redeemer
        assertEq(redeemToken.balanceOf(owner), 0);
        assertEq(redeemToken.balanceOf(address(redeemer)), 250000000 ether);
        // check received balances & sent by the redeemer
        assertEq(token1.balanceOf(owner), 50000 ether);
        assertEq(token2.balanceOf(owner), 20000 ether);
        assertEq(token3.balanceOf(owner), 30000000 ether);
        assertEq(token1.balanceOf(address(redeemer)), 0);
        assertEq(token2.balanceOf(address(redeemer)), 0);
        assertEq(token3.balanceOf(address(redeemer)), 0);
    }

    function testRedeemSendAway() public {
        // configure tokens received and the base used to compute the redemption amounts
        address[] memory tokens = new address[](3);
        tokens[0] = address(token1);
        tokens[1] = address(token2);
        tokens[2] = address(token3);
        vm.prank(addresses.governorAddress);
        redeemer.configureRedemption(tokens, 250000000 ether);

        // owner redeems and sends to receiver
        vm.startPrank(owner);
        redeemToken.approve(address(redeemer), 250000000 ether);
        vm.expectEmit(true, true, true, true);
        emit Redeemed(owner, address(this), 250000000 ether, 250000000 ether);
        redeemer.redeem(address(this), 250000000 ether);
        vm.stopPrank();

        // check tokens spent & received by the redeemer
        assertEq(redeemToken.balanceOf(owner), 0);
        assertEq(redeemToken.balanceOf(address(redeemer)), 250000000 ether);
        // check received balances & sent by the redeemer
        assertEq(token1.balanceOf(address(this)), 50000 ether);
        assertEq(token2.balanceOf(address(this)), 20000 ether);
        assertEq(token3.balanceOf(address(this)), 30000000 ether);
        assertEq(token1.balanceOf(address(redeemer)), 0);
        assertEq(token2.balanceOf(address(redeemer)), 0);
        assertEq(token3.balanceOf(address(redeemer)), 0);
    }

    ///////////////////// withdrawERC20() /////////////////////////
    function testWithdrawERC20BeforeActive() public {
        // mint some tokens to the redeemer
        uint256 balanceBefore = token1.balanceOf(address(redeemer));
        token1.mint(address(redeemer), 10000);

        // PCV_CONTROLLER_ROLE can call withdrawERC20() if redemption is not active
        vm.prank(addresses.pcvControllerAddress);
        redeemer.withdrawERC20(address(token1), address(this), 10000);
        assertEq(token1.balanceOf(address(redeemer)), balanceBefore);
        assertEq(token1.balanceOf(address(this)), 10000);
    }

    function testWithdrawERC20AfterActive() public {
        // mint some tokens to the redeemer
        token1.mint(address(redeemer), 10000);

        // activate redemptions
        address[] memory tokens = new address[](1);
        tokens[0] = address(token1);
        vm.prank(addresses.governorAddress);
        redeemer.configureRedemption(tokens, 10000);

        // should revert when withdrawing tokens after redemption is active
        vm.expectRevert(bytes("Redemptions started"));
        vm.prank(addresses.pcvControllerAddress);
        redeemer.withdrawERC20(address(token1), address(this), 10000);
    }
}
