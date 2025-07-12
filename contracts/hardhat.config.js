require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20", // Should match your Solidity version in FarmerMarket.sol
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [
        // This is the private key for Hardhat Account #0
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ]
    }
  }
};
