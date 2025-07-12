const ethers = require('ethers');
const fs = require('fs');
const readline = require('readline');
const { rpcUrl, privateKey, contractAddress, abi } = require('./config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

async function runAgent() {
  console.log('\n🤖 Hello! I’m your AgriChain AI Agent (Farmer Mode)');

  // Debug info for troubleshooting contract call issues
  console.log('ℹ️  Using contract address:', contractAddress);
  console.log('ℹ️  Using RPC URL:', rpcUrl);
  // Check ABI for getMatchingBuyer
  const hasGetMatchingBuyer = abi.some(f => f.name === 'getMatchingBuyer');
  console.log('ℹ️  ABI contains getMatchingBuyer:', hasGetMatchingBuyer);

  const item = await ask('🌾 What are you offering to sell (e.g., tomato)? ');
  const quantity = parseInt(await ask('⚖️ Quantity available (in kg): '), 10);
  const minPrice = parseFloat(await ask("💰 Minimum price per kg you're expecting: ₹"));

  console.log('🔍 Searching for buyers on-chain...');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  // Print network info
  try {
    const network = await provider.getNetwork();
    console.log('ℹ️  Connected to network:', network);
  } catch (e) {
    console.log('⚠️  Could not fetch network info:', e.message);
  }

  try {
    const result = await contract.getMatchingBuyer(item, quantity, ethers.parseUnits(minPrice.toString(), 'ether'));
    if (result.buyer !== ethers.ZeroAddress) {
      console.log(`✅ Match found! Buyer ${result.name} wants ${result.quantity}kg of ${result.item} at ₹${result.pricePerKg}/kg`);
    } else {
      console.log('❌ No matching buyer found at or above your expected price.');
    }
  } catch (err) {
    console.error('⚠️ Error during on-chain lookup:', err.reason || err.message || err);
  }

  rl.close();
}

module.exports = { runAgent };
