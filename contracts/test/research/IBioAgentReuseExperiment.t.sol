// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;
import {Test} from "forge-std/Test.sol";
import {Aqua} from "../../vendor/aqua/src/Aqua.sol";
import {AquaFlyApp, AquaTestToken} from "../../src/AquaFlyApp.sol";
import {SharedAquaFlyApp} from "../../src/SharedFlyMarket.sol";
import {BioAgentRegistry} from "../../src/BioAgentRegistry.sol";
import {IBioAgent} from "../../src/interfaces/IBioAgent.sol";

/// @notice Isolated EVM experiment: shared input revision across two consumers.
contract IBioAgentReuseExperiment is Test {
    Aqua aqua;
    AquaFlyApp first;
    SharedAquaFlyApp second;
    AquaTestToken t0;
    AquaTestToken t1;
    BioAgentRegistry registry;
    bytes32 constant MODEL = keccak256("research-model");
    address taker = address(123);

    function setUp() public {
        vm.chainId(31337);
        aqua = new Aqua();
        t0 = new AquaTestToken("A");
        t1 = new AquaTestToken("B");
        registry = new BioAgentRegistry();
        registry.registerAgent(MODEL, "experiment-1");
        registry.registerAgent(MODEL, "experiment-2");
        first = new AquaFlyApp(aqua, t0, t1, registry);
        second = new SharedAquaFlyApp(aqua, t0, t1, registry);
        t0.approve(address(aqua), type(uint256).max);
        t1.approve(address(aqua), type(uint256).max);
        t0.transfer(taker, 100 ether);
        vm.startPrank(taker);
        t0.approve(address(first), type(uint256).max);
        t0.approve(address(second), type(uint256).max);
        vm.stopPrank();
    }

    function ship(address app, bytes memory strategy) internal {
        address[] memory tokens = new address[](2);
        tokens[0] = address(t0);
        tokens[1] = address(t1);
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 50 ether;
        amounts[1] = 50 ether;
        aqua.ship(app, strategy, tokens, amounts);
    }

    function firstStrategy(uint256 agent) internal pure returns (bytes memory) {
        return abi.encode(AquaFlyApp.Strategy(agent, 1, 30, MODEL, bytes32(0)));
    }

    function secondStrategy(uint256 agent) internal view returns (bytes memory) {
        return abi.encode(
            SharedAquaFlyApp.Strategy(agent, 1, 30, 1 ether, block.timestamp + 300, MODEL, bytes32(0))
        );
    }

    function revise(uint256 agent) internal {
        IBioAgent common = IBioAgent(address(registry));
        common.updateStatus(agent, common.getStatus(agent).revision, IBioAgent.Activity.Rest, 5000, 9000);
    }

    function testOneCommonUpdateInvalidatesStrategiesInBothConsumers() public {
        bytes memory one = firstStrategy(1);
        bytes memory two = secondStrategy(1);
        ship(address(first), one);
        ship(address(second), two);
        vm.prank(taker);
        assertEq(first.swap(address(this), one, true, 1 ether, 0), 0.997 ether);
        assertEq(second.quote(address(this), two, true, 1 ether), 0.997 ether);
        uint256 before = t0.balanceOf(taker);
        revise(1); // One IBioAgent call; this controller knows no application-specific API.
        vm.expectRevert("stale stimulus");
        vm.prank(taker);
        first.swap(address(this), one, true, 1 ether, 0);
        vm.expectRevert("stale stimulus");
        second.quote(address(this), two, true, 1 ether);
        assertEq(t0.balanceOf(taker), before);
    }

    function testUpdatingOneIndividualDoesNotInvalidateAnother() public {
        bytes memory other = secondStrategy(2);
        ship(address(second), other);
        revise(1);
        assertEq(registry.getStatus(2).revision, 1);
        assertEq(second.quote(address(this), other, true, 1 ether), 0.997 ether);
    }
}
