const fs = require("fs");
const path = require("path");

// Define paths
const rootDir = path.join(__dirname, "..");
const contractsSharedAbiDir = path.join(rootDir, "shared", "abi");
const contractsDeployInfo = path.join(rootDir, "shared", "deploy-info.json");

const frontendPublicAbiDir = path.join(rootDir, "frontend", "public", "abi");
const frontendDeployInfo = path.join(rootDir, "frontend", "public", "deploy-info.json");

// Ensure destination ABI folder exists
if (!fs.existsSync(frontendPublicAbiDir)) {
fs.mkdirSync(frontendPublicAbiDir, { recursive: true });
}

// ✅ Check if ABI source exists
if (!fs.existsSync(contractsSharedAbiDir)) {
console.error("❌ ABI directory does not exist. Run exportABI.js first.");
process.exit(1);
}

// Copy all ABI files
const abiFiles = fs.readdirSync(contractsSharedAbiDir);
abiFiles.forEach((file) => {
const src = path.join(contractsSharedAbiDir, file);
const dest = path.join(frontendPublicAbiDir, file);
fs.copyFileSync(src, dest);
console.log(`Copied ABI: ${file}`);
});

// Copy deploy-info.json
if (fs.existsSync(contractsDeployInfo)) {
fs.copyFileSync(contractsDeployInfo, frontendDeployInfo);
console.log("✅ Copied deploy-info.json");
} else {
console.warn("⚠️ deploy-info.json not found.");
}

console.log("✅ Copy completed.");