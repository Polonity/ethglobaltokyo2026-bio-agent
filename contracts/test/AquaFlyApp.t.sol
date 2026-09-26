// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;
import {Test} from "forge-std/Test.sol";
import {Aqua} from "../vendor/aqua/src/Aqua.sol";
import {AquaFlyApp, AquaTestToken} from "../src/AquaFlyApp.sol";
import {BioAgentRegistry} from "../src/BioAgentRegistry.sol";
import {IBioAgent} from "../src/interfaces/IBioAgent.sol";

contract AquaFlyAppTest is Test {
    Aqua aqua;
    AquaFlyApp app;
    AquaTestToken t0;
    AquaTestToken t1;
    BioAgentRegistry registry;
    bytes32 constant MODEL = keccak256("test-model");
    address taker = address(0x123);

    function createAqua() internal virtual returns (Aqua) {
        return new Aqua();
    }

    function setUp() public virtual {
        aqua = createAqua();
        t0 = new AquaTestToken("N");
        t1 = new AquaTestToken("P");
        registry = new BioAgentRegistry();
        for (uint256 i = 0; i < 3; i++) {
            registry.registerAgent(MODEL, "local");
        }
        app = new AquaFlyApp(aqua, t0, t1, registry);
        t0.approve(address(aqua), type(uint256).max);
        t1.approve(address(aqua), type(uint256).max);
        t0.transfer(taker, 100 ether);
        vm.prank(taker);
        t0.approve(address(app), type(uint256).max);
    }

    function tokens() internal view returns (address[] memory t) {
        t = new address[](2);
        t[0] = address(t0);
        t[1] = address(t1);
    }

    function ship(uint256 id) internal returns (bytes memory s) {
        s = abi.encode(id, uint256(1), uint256(30), MODEL, bytes32(0));
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100 ether;
        amounts[1] = 100 ether;
        aqua.ship(address(app), s, tokens(), amounts);
    }

    function fill(bytes memory s) internal returns (uint256) {
        vm.prank(taker);
        return app.swap(address(this), s, true, 1 ether, 0.997 ether);
    }

    function testSharedWalletAndAtomicFill() public {
        bytes memory s = ship(1);
        bytes memory other = ship(2);
        ship(3);
        assertEq(t0.balanceOf(address(this)), 900 ether);
        assertEq(t1.balanceOf(address(this)), 1000 ether);
        assertEq(t0.balanceOf(address(aqua)), 0);
        assertEq(t1.balanceOf(address(aqua)), 0);
        assertEq(fill(s), 0.997 ether);
        assertEq(t0.balanceOf(address(this)), 901 ether);
        assertEq(t1.balanceOf(address(this)), 999.003 ether);
        (uint248 own,) = aqua.rawBalances(address(this), address(app), keccak256(s), address(t1));
        (uint248 untouched,) = aqua.rawBalances(address(this), address(app), keccak256(other), address(t1));
        assertEq(own, 99.003 ether);
        assertEq(untouched, 100 ether);
        assertEq(t0.balanceOf(address(app)), 0);
        assertEq(t1.balanceOf(address(aqua)), 0);
    }

    function testDockPreventsFillAndKeepsWallet() public {
        bytes memory s = ship(1);
        aqua.dock(address(app), keccak256(s), tokens());
        vm.expectRevert();
        vm.prank(taker);
        app.swap(address(this), s, true, 1 ether, 0);
        assertEq(t0.balanceOf(address(this)), 900 ether);
        assertEq(t1.balanceOf(address(this)), 1000 ether);
    }

    function testNewStimulusBlocksOldStrategyBeforeDock() public {
        bytes memory s = ship(1);
        registry.updateStatus(1, 1, IBioAgent.Activity.Rest, 5000, 10000);
        vm.expectRevert("stale stimulus");
        vm.prank(taker);
        app.swap(address(this), s, true, 1 ether, 0);
    }

    function testInsufficientWalletRollsBackInputAndAccounting() public {
        bytes memory s = ship(1);
        t1.transfer(address(0x456), t1.balanceOf(address(this)));
        vm.expectRevert();
        vm.prank(taker);
        app.swap(address(this), s, true, 1 ether, 0);
        assertEq(t0.balanceOf(taker), 100 ether);
        assertEq(t0.balanceOf(address(this)), 900 ether);
        (uint248 b,) = aqua.rawBalances(address(this), address(app), keccak256(s), address(t0));
        assertEq(b, 100 ether);
    }

    function testStrategyCannotBeReshippedAfterDock() public {
        bytes memory s = ship(1);
        aqua.dock(address(app), keccak256(s), tokens());
        vm.expectRevert();
        ship(1);
    }

    function testSlippageAndIdentity() public {
        bytes memory s = ship(1);
        vm.expectRevert("slippage");
        vm.prank(taker);
        app.swap(address(this), s, true, 1 ether, 1 ether);
        vm.expectRevert("identity");
        vm.prank(taker);
        app.swap(address(0x999), s, true, 1 ether, 0);
    }
}
