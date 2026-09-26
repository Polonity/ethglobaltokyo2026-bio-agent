// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;
import {AquaFlyAppTest} from "./AquaFlyApp.t.sol";
import {Aqua} from "../vendor/aqua/src/Aqua.sol";

/// Reuses the position tests against the real canonical deployment, without etch or redeployment.
/// Run with RUN_AQUA_FORK=true and forge --fork-url; ordinary unit suites skip this class.
contract AquaOfficialForkTest is AquaFlyAppTest {
    function setUp() public override {
        if (!vm.envOr("RUN_AQUA_FORK", false)) vm.skip(true);
        super.setUp();
    }

    function createAqua() internal override returns (Aqua) {
        address canonical = 0x1111113CCf1426A8E30e2bfF5E005d929bF6a90a;
        require(canonical.code.length > 0, "Official Aqua missing from fork");
        require(canonical.codehash == vm.envBytes32("AQUA_EXPECTED_CODE_HASH"), "Official code changed");
        return Aqua(canonical);
    }
}
