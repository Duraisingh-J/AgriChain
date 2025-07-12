require('dotenv').config();
const fs = require('fs');
const path = require('path');

// ✅ Adjust the path to match your project directory structure
const artifactPath = path.resolve(__dirname, '../artifacts/contracts/contracts/FarmerMarket.sol/FarmerMarket.json');

// ✅ Load ABI from the compiled contract artifact
const abi = JSON.parse(fs.readFileSync(artifactPath, 'utf8')).abi;

module.exports = {
  abi,
  rpcUrl: process.env.RPC_URL, // fallback to local node
  privateKey: process.env.PRIVATE_KEY, // fallback if not using .env
  contractAddress: process.env.CONTRACT_ADDRESS // fallback deployed address
};
