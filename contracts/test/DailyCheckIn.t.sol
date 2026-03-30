// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DailyCheckIn} from "../src/DailyCheckIn.sol";

contract DailyCheckInTest is Test {
    DailyCheckIn public c;
    address alice = address(0xA11CE);

    function setUp() public {
        c = new DailyCheckIn();
    }

    function test_checkIn_stores_day_and_streak_one() public {
        uint256 day = block.timestamp / 1 days;
        vm.prank(alice);
        c.checkIn();
        assertEq(c.lastCheckDayIndex(alice), day);
        assertEq(c.streakCount(alice), 1);
    }

    function test_RevertWhen_second_check_same_day() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.expectRevert(DailyCheckIn.AlreadyCheckedToday.selector);
        c.checkIn();
        vm.stopPrank();
    }

    function test_RevertWhen_msg_value_nonzero() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(DailyCheckIn.NoEthAccepted.selector);
        c.checkIn{value: 1 wei}();
    }

    function test_streak_increments_consecutive_days() public {
        uint256 t0 = 1_700_000_000;
        vm.warp(t0);
        vm.prank(alice);
        c.checkIn();

        vm.warp(t0 + 1 days);
        vm.prank(alice);
        c.checkIn();
        assertEq(c.streakCount(alice), 2);

        vm.warp(t0 + 2 days);
        vm.prank(alice);
        c.checkIn();
        assertEq(c.streakCount(alice), 3);
    }

    function test_streak_resets_after_gap() public {
        uint256 t0 = 1_700_000_000;
        vm.warp(t0);
        vm.prank(alice);
        c.checkIn();

        vm.warp(t0 + 2 days);
        vm.prank(alice);
        c.checkIn();
        assertEq(c.streakCount(alice), 1);
    }
}
