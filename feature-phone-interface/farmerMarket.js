import { ethers } from 'ethers';
import dotenv from 'dotenv';
import cropCodes from '../shared/cropCodes.js';
import FarmerMarketABI from '../shared/abi/FarmerMarket.json' with { type: 'json' };
import AgentAccessABI from '../shared/abi/AgentAccess.json' with { type: 'json' };

dotenv.config();

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);

const farmerMarket = new ethers.Contract(
  process.env.FARMER_MARKET_ADDR,
  FarmerMarketABI, // ✅ Pass full ABI directly
  wallet
);

const agentAccess = new ethers.Contract(
  process.env.AGENT_ACCESS_ADDR,
  AgentAccessABI, // ✅ Pass full ABI directly
  wallet
);

export async function listProduce(farmerAddr, cropCode, quantity, pricePerKg) {
  const crop = cropCodes[cropCode];
  if (!crop) throw new Error('Invalid crop code');

  const approved = await agentAccess.isAgentApproved(farmerAddr, wallet.address);
  if (!approved) throw new Error('Agent not approved');

  const tx = await farmerMarket.registerListing("IVR", crop, quantity, pricePerKg);
  await tx.wait();
  return tx.hash;
}
