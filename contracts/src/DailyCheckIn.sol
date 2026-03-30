// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice One free check-in per UTC day (unix day index). No ETH accepted.
/// @dev Stored day is (unixDay + 1) so 0 means "never checked" (day 0 is valid).
contract DailyCheckIn {
    error NoEthAccepted();
    error AlreadyCheckedToday();

    event CheckedIn(address indexed user, uint256 dayIndex, uint256 streak);

    /// @notice Previous check-in day index + 1; 0 means never checked in.
    mapping(address => uint256) public lastCheckDayEncoded;
    mapping(address => uint256) public streakCount;

    function lastCheckDayIndex(address user) external view returns (uint256) {
        uint256 enc = lastCheckDayEncoded[user];
        return enc == 0 ? 0 : enc - 1;
    }

    function checkIn() external payable {
        if (msg.value != 0) revert NoEthAccepted();

        uint256 today = block.timestamp / 1 days;
        uint256 enc = lastCheckDayEncoded[msg.sender];
        uint256 lastDay = enc == 0 ? type(uint256).max : enc - 1;
        if (lastDay == today) revert AlreadyCheckedToday();

        uint256 streak = 1;
        if (enc != 0 && today == lastDay + 1) {
            streak = streakCount[msg.sender] + 1;
        }

        lastCheckDayEncoded[msg.sender] = today + 1;
        streakCount[msg.sender] = streak;
        emit CheckedIn(msg.sender, today, streak);
    }
}
