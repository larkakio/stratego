// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {DailyCheckIn} from "../src/DailyCheckIn.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        DailyCheckIn deployed = new DailyCheckIn();
        vm.stopBroadcast();
        console2.log("DailyCheckIn:", address(deployed));
    }
}
