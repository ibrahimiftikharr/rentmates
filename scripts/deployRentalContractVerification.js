import hre from "hardhat";

async function main() {
  console.log('🚀 Starting RentalContractVerification deployment...\n');
  
  // Get the signer (deployer)
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', await deployer.getAddress());
  
  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'MATIC\n');
  
  // Deploy RentalContractVerification contract
  console.log('Deploying RentalContractVerification...');
  const RentalContractVerification = await hre.ethers.getContractFactory('RentalContractVerification');
  const contract = await RentalContractVerification.deploy();
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log('✅ RentalContractVerification deployed to:', contractAddress);
  
  // Save deployment info
  console.log('\n📝 Contract Deployment Summary:');
  console.log('================================');
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer Address: ${await deployer.getAddress()}`);
  console.log(`Network: ${(await hre.ethers.provider.getNetwork()).name}`);
  console.log('================================');
  
  console.log('\n⚠️  IMPORTANT: Add this address to your .env file:');
  console.log(`RENTAL_CONTRACT_VERIFICATION_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
