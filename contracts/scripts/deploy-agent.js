const hre = require("hardhat");

async function main() {
  const AgentAccess = await hre.ethers.getContractFactory("AgentAccess");
  const contract = await AgentAccess.deploy();
  await contract.waitForDeployment();

  console.log(`✅ AgentAccess deployed to: ${contract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
