require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  paths: {
    sources: "./contracts/contracts",  // Points to the nested folder
    artifacts: "./artifacts",          // Default is fine
    cache: "./cache"                   // Default is fine
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [
        // You can add specific private keys here if needed
        // "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ]
    },
    hardhat: {
      chainId: 31337
    }
  }
};