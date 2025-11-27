// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RentmatesVault {
    IERC20 public usdtToken;
    address public backend; // Only backend can request withdrawals

    constructor(address _usdt, address _backend) {
        usdtToken = IERC20(_usdt);
        backend = _backend;
    }

    function deposit(uint256 amount) external {
        require(
            usdtToken.transferFrom(msg.sender, address(this), amount),
            "USDT transfer failed"
        );
    }

    function withdraw(address user, uint256 amount) external {
        require(msg.sender == backend, "Not authorized backend");

        require(
            usdtToken.transfer(user, amount),
            "Withdraw transfer failed"
        );
    }
}
