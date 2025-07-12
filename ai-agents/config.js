require('dotenv').config();
const fs = require('fs');
const path = require('path');

// 👇 Update the path to match the real artifact location
const artifactPath = path.resolve(__dirname, '../artifacts/contracts/contracts/FarmerMarket.sol/FarmerMarket.json');

const abi = JSON.parse(fs.readFileSync(artifactPath, 'utf8')).abi;

module.exports = {
  abi,
  rpcUrl: process.env.RPC_URL,
  privateKey: process.env.PRIVATE_KEY,
  contractAddress: process.env.CONTRACT_ADDRESS
};
