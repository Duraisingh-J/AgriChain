const hre = require("hardhat");

async function main() {
  const FarmerRegistry = await hre.ethers.getContractFactory("FarmerRegistry");
  const contract = await FarmerRegistry.deploy();
  await contract.waitForDeployment();
  console.log(`FarmerRegistry deployed to: ${contract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
