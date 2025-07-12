require('dotenv').config();
const { runAgent } = require('./agent.js');

async function main() {
  console.log("🚀 Starting AgriChain AI Agent (Farmer-Initiated Match)...");
  await runAgent();
}

main();
