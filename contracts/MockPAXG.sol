// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockPAXG is ERC20 {
    constructor() ERC20("Paxos Gold", "PAXG") {
        // Mint 10,000 PAXG tokens (PAXG has 18 decimals like most gold-backed tokens)
        _mint(msg.sender, 10000 * 10**18);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
