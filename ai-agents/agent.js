const ethers = require("ethers");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

async function runAgent() {
  console.log("\n🤖 Hello! I’m your AgriChain AI Agent (Farmer Mode)");

  const produce = await ask("🌾 What are you offering to sell (e.g., tomato)? ");
  const quantity = parseInt(await ask("⚖️ Quantity available (in kg): "), 10);
  const price = parseFloat(await ask("💰 Minimum price per kg you're expecting: ₹"));

  console.log("🔍 Searching for buyers on-chain...");

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const abi = JSON.parse(fs.readFileSync(process.env.PRODUCE_MARKET_ABI_PATH, 'utf-8'));
  const contract = new ethers.Contract(process.env.PRODUCE_MARKET_ADDRESS, abi, wallet);

  try {
    const buyerCount = await contract.getBuyerCount();
    let found = false;

    for (let i = 0; i < buyerCount; i++) {
      const buyer = await contract.buyers(i);

      if (
        buyer.produce.toLowerCase() === produce.toLowerCase() &&
        parseInt(buyer.quantity) === quantity &&
        parseFloat(ethers.formatEther(buyer.pricePerKg)) >= price
      ) {
        console.log(`✅ Match found: Buyer ${buyer.buyer} is offering ₹${ethers.formatEther(buyer.pricePerKg)}/kg for ${quantity}kg of ${produce}`);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log("❌ No matching buyer found at or above your expected price.");
    }
  } catch (err) {
    console.error("⚠️ Error searching buyers:", err.message);
  }

  rl.close();
}

module.exports = { runAgent };
