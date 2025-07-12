const hre = require("hardhat");

async function main() {
  const ProduceMarket = await hre.ethers.getContractFactory("ProduceMarket");
  const produce = await ProduceMarket.deploy();
  await produce.waitForDeployment();

  const FarmerRegistry = await hre.ethers.getContractFactory("FarmerRegistry");
  const farmer = await FarmerRegistry.deploy();
  await farmer.waitForDeployment();

  const AgentAccess = await hre.ethers.getContractFactory("AgentAccess");
  const agent = await AgentAccess.deploy();
  await agent.waitForDeployment();

  console.log("ProduceMarket deployed to:", produce.target);
  console.log("FarmerRegistry deployed to:", farmer.target);
  console.log("AgentAccess deployed to:", agent.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
