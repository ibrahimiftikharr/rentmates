// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title RentalContractVerification
 * @dev Smart contract for storing and verifying rental contract hashes and IPFS CIDs
 */
contract RentalContractVerification {
    struct ContractRecord {
        bytes32 contractHash;      // SHA-256 hash of the contract document
        string ipfsCID;           // IPFS Content Identifier
        address landlord;         // Landlord's wallet address
        address student;          // Student's wallet address
        uint256 timestamp;        // Block timestamp when stored
        bool exists;              // Flag to check if record exists
    }

    // Mapping from contract ID to contract record
    mapping(uint256 => ContractRecord) public contracts;
    
    // Mapping to track if a hash already exists
    mapping(bytes32 => bool) public hashExists;
    
    // Counter for contract IDs
    uint256 public contractCount;
    
    // Events
    event ContractStored(
        uint256 indexed contractId,
        bytes32 contractHash,
        string ipfsCID,
        address indexed landlord,
        address indexed student,
        uint256 timestamp
    );
    
    /**
     * @dev Store a new rental contract record on the blockchain
     * @param _contractHash SHA-256 hash of the contract document
     * @param _ipfsCID IPFS Content Identifier for the contract document
     * @param _landlord Landlord's wallet address
     * @param _student Student's wallet address
     * @return contractId The ID of the stored contract
     */
    function storeContract(
        bytes32 _contractHash,
        string memory _ipfsCID,
        address _landlord,
        address _student
    ) external returns (uint256) {
        require(_contractHash != 0, "Contract hash cannot be empty");
        require(bytes(_ipfsCID).length > 0, "IPFS CID cannot be empty");
        require(_landlord != address(0), "Invalid landlord address");
        require(_student != address(0), "Invalid student address");
        require(!hashExists[_contractHash], "Contract hash already exists");
        
        contractCount++;
        uint256 contractId = contractCount;
        
        contracts[contractId] = ContractRecord({
            contractHash: _contractHash,
            ipfsCID: _ipfsCID,
            landlord: _landlord,
            student: _student,
            timestamp: block.timestamp,
            exists: true
        });
        
        hashExists[_contractHash] = true;
        
        emit ContractStored(
            contractId,
            _contractHash,
            _ipfsCID,
            _landlord,
            _student,
            block.timestamp
        );
        
        return contractId;
    }
    
    /**
     * @dev Verify if a contract hash matches the stored record
     * @param _contractId The ID of the contract to verify
     * @param _contractHash The hash to verify against
     * @return bool True if the hash matches
     */
    function verifyContract(uint256 _contractId, bytes32 _contractHash) 
        external 
        view 
        returns (bool) 
    {
        require(contracts[_contractId].exists, "Contract does not exist");
        return contracts[_contractId].contractHash == _contractHash;
    }
    
    /**
     * @dev Get contract record by ID
     * @param _contractId The ID of the contract
     * @return contractHash The SHA-256 hash of the contract
     * @return ipfsCID The IPFS Content Identifier
     * @return landlord The landlord's address
     * @return student The student's address
     * @return timestamp The block timestamp when stored
     */
    function getContract(uint256 _contractId) 
        external 
        view 
        returns (
            bytes32 contractHash,
            string memory ipfsCID,
            address landlord,
            address student,
            uint256 timestamp
        ) 
    {
        require(contracts[_contractId].exists, "Contract does not exist");
        
        ContractRecord memory record = contracts[_contractId];
        return (
            record.contractHash,
            record.ipfsCID,
            record.landlord,
            record.student,
            record.timestamp
        );
    }
}
