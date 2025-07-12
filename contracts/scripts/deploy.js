const { ethers } = require("hardhat");

async function main() {
  const FarmerMarket = await ethers.getContractFactory("FarmerMarket");
  const farmerMarket = await FarmerMarket.deploy();

  await farmerMarket.waitForDeployment(); // Wait for deployment confirmation

  console.log("✅ FarmerMarket deployed to:", await farmerMarket.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
