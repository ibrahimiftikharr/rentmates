// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RentMatesCollateralHolder
 * @dev Holds PAXG collateral for student loan applications
 * Students can deposit and withdraw PAXG tokens
 */
contract RentMatesCollateralHolder is ReentrancyGuard {
    // PAXG token contract address
    IERC20 public paxgToken;
    
    // Mapping from student address to their collateral balance
    mapping(address => uint256) public collateralBalances;
    
    // Total collateral held in the contract
    uint256 public totalCollateral;
    
    // Events
    event CollateralDeposited(address indexed student, uint256 amount, uint256 newBalance);
    event CollateralWithdrawn(address indexed student, uint256 amount, uint256 newBalance);
    
    /**
     * @dev Constructor sets the PAXG token address
     * @param _paxgTokenAddress Address of the PAXG token contract
     */
    constructor(address _paxgTokenAddress) {
        require(_paxgTokenAddress != address(0), "Invalid PAXG token address");
        paxgToken = IERC20(_paxgTokenAddress);
    }
    
    /**
     * @dev Deposit PAXG collateral into the contract
     * @param amount Amount of PAXG to deposit (in wei, 18 decimals)
     */
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer PAXG from student to this contract
        require(
            paxgToken.transferFrom(msg.sender, address(this), amount),
            "PAXG transfer failed"
        );
        
        // Update balances
        collateralBalances[msg.sender] += amount;
        totalCollateral += amount;
        
        emit CollateralDeposited(msg.sender, amount, collateralBalances[msg.sender]);
    }
    
    /**
     * @dev Withdraw PAXG collateral from the contract
     * @param amount Amount of PAXG to withdraw (in wei, 18 decimals)
     */
    function withdrawCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(collateralBalances[msg.sender] >= amount, "Insufficient collateral balance");
        
        // Update balances first (checks-effects-interactions pattern)
        collateralBalances[msg.sender] -= amount;
        totalCollateral -= amount;
        
        // Transfer PAXG from this contract back to student
        require(
            paxgToken.transfer(msg.sender, amount),
            "PAXG transfer failed"
        );
        
        emit CollateralWithdrawn(msg.sender, amount, collateralBalances[msg.sender]);
    }
    
    /**
     * @dev Get collateral balance for a specific student
     * @param student Address of the student
     * @return Balance of collateral for the student
     */
    function getBalance(address student) external view returns (uint256) {
        return collateralBalances[student];
    }
    
    /**
     * @dev Get the student's own collateral balance
     * @return Balance of collateral for the caller
     */
    function getMyBalance() external view returns (uint256) {
        return collateralBalances[msg.sender];
    }
}
