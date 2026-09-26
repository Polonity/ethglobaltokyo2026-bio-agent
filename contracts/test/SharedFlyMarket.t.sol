// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;
import {Test} from "forge-std/Test.sol";
import {Aqua} from "../vendor/aqua/src/Aqua.sol";
import {SharedAquaFlyApp, SharedFlyToken, FlyV3Router} from "../src/SharedFlyMarket.sol";
import {BioAgentRegistry} from "../src/BioAgentRegistry.sol";
import {IBioAgent} from "../src/interfaces/IBioAgent.sol";

contract SharedFlyMarketTest is Test {
    Aqua aqua;
    SharedAquaFlyApp app;
    SharedFlyToken a;
    SharedFlyToken b;
    BioAgentRegistry registry;
    address taker = address(123);
    bytes32 model = keccak256("model");

    function setUp() public {
        vm.chainId(31337);
        aqua = new Aqua();
        a = new SharedFlyToken("A");
        b = new SharedFlyToken("B");
        registry = new BioAgentRegistry();
        registry.registerAgent(model, "local");
        app = new SharedAquaFlyApp(aqua, a, b, registry);
        a.approve(address(aqua), type(uint256).max);
        b.approve(address(aqua), type(uint256).max);
        a.transfer(taker, 100 ether);
        b.transfer(taker, 100 ether);
        vm.startPrank(taker);
        a.approve(address(app), type(uint256).max);
        b.approve(address(app), type(uint256).max);
        vm.stopPrank();
    }

    function ship() internal returns (bytes memory strategy) {
        strategy = abi.encode(
            SharedAquaFlyApp.Strategy(1, 1, 10, 2 ether, block.timestamp + 90, model, bytes32(0))
        );
        address[] memory tokens = new address[](2);
        tokens[0] = address(a);
        tokens[1] = address(b);
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100 ether;
        amounts[1] = 100 ether;
        aqua.ship(address(app), strategy, tokens, amounts);
    }

    function testRateAndReverseFill() public {
        bytes memory s = ship();
        assertEq(app.quote(address(this), s, true, 1 ether), 1.998 ether);
        vm.prank(taker);
        app.swap(address(this), s, true, 1 ether, 1.998 ether, block.timestamp + 30);
        assertEq(a.balanceOf(taker), 99 ether);
        assertEq(b.balanceOf(taker), 101.998 ether);
        vm.prank(taker);
        app.swap(address(this), s, false, 2 ether, 0.999 ether, block.timestamp + 30);
        assertEq(a.balanceOf(taker), 99.999 ether);
        assertEq(b.balanceOf(taker), 99.998 ether);
    }

    function testExpiredOffer() public {
        bytes memory s = ship();
        vm.warp(block.timestamp + 91);
        vm.expectRevert("expired");
        app.quote(address(this), s, true, 1 ether);
    }

    function testStaleStatus() public {
        bytes memory s = ship();
        registry.updateStatus(1, 1, IBioAgent.Activity.Rest, 5000, 0);
        vm.expectRevert("stale stimulus");
        app.quote(address(this), s, true, 1 ether);
    }

    function testSlippageAtomicity() public {
        bytes memory s = ship();
        vm.expectRevert("slippage");
        vm.prank(taker);
        app.swap(address(this), s, true, 1 ether, 2 ether, block.timestamp + 30);
        assertEq(a.balanceOf(taker), 100 ether);
    }

    function testEmptyWalletCannotQuoteOrFill() public {
        bytes memory s = ship();
        b.transfer(address(456), b.balanceOf(address(this)));
        vm.expectRevert("inventory");
        app.quote(address(this), s, true, 1 ether);
    }

    function testDeadlineAndTradeCap() public {
        bytes memory s = ship();
        vm.warp(block.timestamp + 1);
        vm.expectRevert("busy/expired");
        app.swap(address(this), s, true, 1 ether, 0, block.timestamp - 1);
        vm.expectRevert("bounds");
        app.quote(address(this), s, true, 11 ether);
    }

    function testWrongMaker() public {
        bytes memory s = ship();
        vm.expectRevert("identity");
        app.quote(address(999), s, true, 1 ether);
    }

    function testDockRemovesExecutableQuote() public {
        bytes memory s = ship();
        address[] memory tokens = new address[](2);
        tokens[0] = address(a);
        tokens[1] = address(b);
        aqua.dock(address(app), keccak256(s), tokens);
        vm.expectRevert();
        app.quote(address(this), s, true, 1 ether);
    }
}

contract FlyV3RouterTest is Test {
    FlyV3Router router;
    SharedFlyToken a;
    SharedFlyToken b;
    address trader = address(123);

    function setUp() public {
        vm.chainId(31337);
        bytes memory code = vm.getCode(
            "../node_modules/@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"
        );
        address factory;
        assembly { factory := create(0, add(code, 32), mload(code)) }
        require(factory != address(0));
        a = new SharedFlyToken("A");
        b = new SharedFlyToken("B");
        router = new FlyV3Router(factory, address(a), address(b));
        a.approve(address(router), type(uint256).max);
        b.approve(address(router), type(uint256).max);
        router.seed();
        a.transfer(trader, 100 ether);
        b.transfer(trader, 100 ether);
        vm.startPrank(trader);
        a.approve(address(router), type(uint256).max);
        b.approve(address(router), type(uint256).max);
        vm.stopPrank();
    }

    function testQuoteMatchesActualOutputAndCallerPays() public {
        uint256 quoted = router.quote(true, 2 ether);
        uint256 input = router.token0().balanceOf(trader);
        uint256 output = router.token1().balanceOf(trader);
        vm.prank(trader);
        assertEq(router.swap(true, 2 ether, quoted, block.timestamp + 30), quoted);
        assertEq(router.token0().balanceOf(trader), input - 2 ether);
        assertEq(router.token1().balanceOf(trader), output + quoted);
    }

    function testFailedMinimumRollsBackBothTokens() public {
        uint256 input = router.token0().balanceOf(trader);
        uint256 output = router.token1().balanceOf(trader);
        vm.expectRevert("partial/slippage");
        vm.prank(trader);
        router.swap(true, 2 ether, 3 ether, block.timestamp + 30);
        assertEq(router.token0().balanceOf(trader), input);
        assertEq(router.token1().balanceOf(trader), output);
    }

    function testSpoofedCallbackCannotSpendAllowance() public {
        vm.expectRevert("pool only");
        router.uniswapV3SwapCallback(1 ether, -1, "");
    }

    function testExpiredOrOversizedOrderRejected() public {
        vm.warp(100);
        vm.expectRevert("bounds/expired");
        router.swap(true, 1 ether, 0, 99);
        vm.expectRevert("bounds/expired");
        router.swap(true, 11 ether, 0, 101);
    }
}
