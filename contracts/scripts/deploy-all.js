const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Deploy ProduceMarket
  const ProduceMarket = await hre.ethers.getContractFactory("ProduceMarket");
  const produce = await ProduceMarket.deploy();
  await produce.waitForDeployment();

  // Deploy FarmerRegistry
  const FarmerRegistry = await hre.ethers.getContractFactory("FarmerRegistry");
  const farmer = await FarmerRegistry.deploy();
  await farmer.waitForDeployment();

  // Deploy AgentAccess
  const AgentAccess = await hre.ethers.getContractFactory("AgentAccess");
  const agent = await AgentAccess.deploy();
  await agent.waitForDeployment();

  // Deploy FarmerMarket
  const FarmerMarket = await hre.ethers.getContractFactory("FarmerMarket");
  const market = await FarmerMarket.deploy();
  await market.waitForDeployment();

  // Create deploy info object
  const deployInfo = {
    localhost: {
      ProduceMarket: produce.target,
      FarmerRegistry: farmer.target,
      AgentAccess: agent.target,
      FarmerMarket: market.target,
    },
  };

  // Create shared directory if it doesn't exist
  const outputDir = path.join(__dirname, "..", "shared");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Write to deploy-info.json
  const filePath = path.join(outputDir, "deploy-info.json");
  fs.writeFileSync(filePath, JSON.stringify(deployInfo, null, 2));

  // Log addresses
  console.log("Contracts deployed and written to shared/deploy-info.json:");
  console.log(JSON.stringify(deployInfo, null, 2));
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
