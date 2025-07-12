const hre = require("hardhat");

async function main() {
  const ProduceMarket = await hre.ethers.getContractFactory("ProduceMarket");
  const contract = await ProduceMarket.deploy();
  await contract.waitForDeployment();
  console.log(`ProduceMarket deployed to: ${contract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
