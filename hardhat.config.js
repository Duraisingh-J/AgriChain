require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.20" },
      { version: "0.8.28" },
    ],
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "metadata", "evm.bytecode", "evm.deployedBytecode", "storageLayout"]
        }
      }
    }
  }
};
