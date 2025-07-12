const fs = require("fs");
const path = require("path");

function exportABI(contractName) {
  const artifactPath = path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  const outPath = path.join(__dirname, `../../shared/abi/${contractName}z.json`);
  fs.writeFileSync(outPath, JSON.stringify(abi, null, 2));
  console.log(`ABI exported for ${contractName}`);
}

exportABI("ProduceMarket");
exportABI("FarmerRegistry");
exportABI("AgentAccess");
