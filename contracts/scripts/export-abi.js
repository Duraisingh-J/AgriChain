const fs = require("fs");
const path = require("path");

function exportABI(contractName) {
const artifactPath = path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
if (!fs.existsSync(artifactPath)) {
console.error(`Artifact not found for ${contractName} at ${artifactPath}`);
return;
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;

const outputDir = path.join(__dirname, "../../shared/abi");
if (!fs.existsSync(outputDir)) {
fs.mkdirSync(outputDir, { recursive: true });
}

const outPath = path.join(outputDir, `${contractName}.json`);
fs.writeFileSync(outPath, JSON.stringify(abi, null, 2));
console.log(`ABI exported for ${contractName} → shared/abi/${contractName}.json`);
}

const contracts = ["ProduceMarket", "FarmerRegistry", "AgentAccess", "FarmerMarket", "Escrow"];

contracts.forEach(exportABI);