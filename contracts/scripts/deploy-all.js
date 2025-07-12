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

// Deploy Escrow
const Escrow = await hre.ethers.getContractFactory("Escrow");
const escrow = await Escrow.deploy();
await escrow.waitForDeployment();

const outputDir = path.join(__dirname, "../../shared");
const filePath = path.join(outputDir, "deploy-info.json");

// Load existing deploy info or create new
let existingData = {};
if (fs.existsSync(filePath)) {
existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Update localhost entry with new addresses
existingData.localhost = {
...existingData.localhost,
ProduceMarket: produce.target,
FarmerRegistry: farmer.target,
AgentAccess: agent.target,
FarmerMarket: market.target,
Escrow: escrow.target,
};

// Ensure shared directory exists
if (!fs.existsSync(outputDir)) {
fs.mkdirSync(outputDir);
}

// Write updated deploy info
fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

console.log("All contracts deployed. Updated deploy-info.json:");
console.log(JSON.stringify(existingData, null, 2));
}

main().catch((error) => {
console.error("Deployment failed:", error);
process.exitCode = 1;
});