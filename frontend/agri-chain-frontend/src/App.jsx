// src/App.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers'; // <--- IMPORT ETHERS.JS!

// Import your new components
import MainLayout from './components/layout/MainLayout.jsx';
import LandingPage from './components/pages/LandingPage.jsx';
import FarmerDashboard from './components/pages/FarmerDashboard.jsx';
import FarmerRegistrationForm from './components/pages/FarmerRegistrationForm.jsx';
import BuyerDashboard from './components/pages/BuyerDashboard.jsx';

// --- YOUR FARMER REGISTRY CONTRACT DETAILS ---
const FARMER_REGISTRY_CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'; // <-- VERIFY THIS IS YOUR LATEST DEPLOYED ADDRESS!
const FARMER_REGISTRY_ABI = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "farmer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint8",
          "name": "newRating",
          "type": "uint8"
        }
      ],
      "name": "FarmerRated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "farmer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        }
      ],
      "name": "FarmerRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "farmers",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "location",
          "type": "string"
        },
        {
          "internalType": "uint8",
          "name": "rating",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "ratingCount",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isRegistered",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "farmerAddress",
          "type": "address"
        }
      ],
      "name": "getFarmer",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            },
            {
              "internalType": "uint8",
              "name": "rating",
              "type": "uint8"
            },
            {
              "internalType": "uint256",
              "name": "ratingCount",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isRegistered",
              "type": "bool"
            }
          ],
          "internalType": "struct FarmerRegistry.Farmer",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "farmerAddress",
          "type": "address"
        },
        {
          "internalType": "uint8",
          "name": "rating",
          "type": "uint8"
        }
      ],
      "name": "rateFarmer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "location",
          "type": "string"
        }
      ],
      "name": "registerFarmer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
// ---------------------------------------------

// Hardhat Localhost Chain ID
const HARDHAT_CHAIN_ID = 31337;

function App() {
  const navigate = useNavigate();

  const [currentAccount, setCurrentAccount] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [isAddressFarmer, setIsAddressFarmer] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [showFarmerBuyerChoice, setShowFarmerBuyerChoice] = useState(false);

  const getProvider = useCallback(() => {
    if (window.ethereum) {
      // Define a custom network for ethers.js for Hardhat Localhost
      // This helps ethers.js recognize the network and potentially avoid unwanted ENS lookups
      const customLocalhostNetwork = new ethers.Network('Hardhat Localhost', HARDHAT_CHAIN_ID);
      // Use the custom network with BrowserProvider
      return new ethers.BrowserProvider(window.ethereum, customLocalhostNetwork);
    }
    return null;
  }, []);

  const checkWalletAndFarmerStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    console.log("Attempting to check wallet and farmer status...");

    try {
      const provider = getProvider();
      if (!provider) {
        console.warn("MetaMask is not installed!");
        setCurrentAccount(null);
        setNetworkId(null);
        setIsAddressFarmer(false);
        setShowFarmerBuyerChoice(false);
        navigate('/');
        return;
      }

      const accounts = await provider.listAccounts();
      if (accounts.length === 0) {
        console.log("No accounts connected to MetaMask.");
        setCurrentAccount(null);
        setNetworkId(null);
        setIsAddressFarmer(false);
        setShowFarmerBuyerChoice(false);
        navigate('/');
        return;
      }

      const account = accounts[0].address;
      setCurrentAccount(account);
      console.log("Connected account:", account);

      const network = await provider.getNetwork();
      const connectedChainId = Number(network.chainId);
      setNetworkId(connectedChainId);
      console.log("Connected to Chain ID:", connectedChainId);

      if (connectedChainId !== HARDHAT_CHAIN_ID) {
        console.warn(`Wrong network. Expected ${HARDHAT_CHAIN_ID}, got ${connectedChainId}.`);
        alert(`Please switch your MetaMask to 'Hardhat Localhost' (Chain ID ${HARDHAT_CHAIN_ID}). Currently connected to Chain ID: ${connectedChainId}`);
        setIsAddressFarmer(false);
        setShowFarmerBuyerChoice(false);
        navigate('/');
        return;
      }

      // Check farmer status on the contract (VIEW CALL)
      console.log("Attempting to create contract instance with address:", FARMER_REGISTRY_CONTRACT_ADDRESS);
      console.log("Using ABI (truncated for log):", FARMER_REGISTRY_ABI.slice(0, 3));

      // --- CRITICAL CHANGE: Instantiate contract with PROVIDER for view calls ---
      // This avoids implicitly getting a signer and triggering ENS lookups for view calls.
      const farmerRegistryContract = new ethers.Contract(FARMER_REGISTRY_CONTRACT_ADDRESS, FARMER_REGISTRY_ABI, provider);

      console.log("Calling farmers mapping for account:", account, "...");
      const farmerStruct = await farmerRegistryContract.farmers(account); // This is a view call

      const isRegistered = farmerStruct.isRegistered;
      setIsAddressFarmer(isRegistered);
      console.log("Farmer struct result:", farmerStruct);
      console.log("isAddressFarmer result:", isRegistered);


      if (isRegistered) {
        navigate('/farmer-dashboard');
        setShowFarmerBuyerChoice(false);
      } else {
        setShowFarmerBuyerChoice(true);
        navigate('/');
      }

    } catch (error) {
      console.error("FULL ERROR OBJECT:", error); // The full error object will still be useful
      console.error("Error checking wallet/farmer status:", error.message || error);
      setCurrentAccount(null);
      setNetworkId(null);
      setIsAddressFarmer(false);
      setShowFarmerBuyerChoice(false);
      navigate('/');
      if (!error.message.includes("No Ethereum provider was found")) {
        alert("Failed to connect or check farmer status. Please ensure MetaMask is connected to the correct network.");
      }
    } finally {
      setIsLoadingStatus(false);
    }
  }, [getProvider, navigate]);


  // Effect for initial load and listening to MetaMask changes
  useEffect(() => {
    checkWalletAndFarmerStatus();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log("MetaMask accounts changed, re-checking status...");
        if (accounts.length === 0) {
          setCurrentAccount(null);
          setNetworkId(null);
          setIsAddressFarmer(false);
          setShowFarmerBuyerChoice(false);
          navigate('/');
        } else {
          checkWalletAndFarmerStatus();
        }
      });
      window.ethereum.on('chainChanged', (chainId) => {
        console.log("MetaMask chain changed to:", chainId, ", re-checking status...");
        checkWalletAndFarmerStatus();
      });
      return () => {
        if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', checkWalletAndFarmerStatus);
            window.ethereum.removeListener('chainChanged', checkWalletAndFarmerStatus);
        }
      };
    }
  }, [checkWalletAndFarmerStatus]);

  // --- Connect Wallet function (called by the header button) ---
  const connectWallet = async () => {
    try {
      const provider = getProvider();
      if (!provider) {
        alert("MetaMask is not installed! Please install it to connect.");
        return;
      }
      await provider.send("eth_requestAccounts", []);
      checkWalletAndFarmerStatus();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please ensure MetaMask is unlocked and try again.");
    }
  };

  // --- Farmer Registration Form Submission (WRITE CALL) ---
  const handleRegisterFarmer = async ({ name, location }) => {
    if (!currentAccount || networkId !== HARDHAT_CHAIN_ID) {
      alert("Please connect your wallet to the Hardhat Localhost network first.");
      return;
    }
    setIsLoadingStatus(true);
    try {
      const provider = getProvider();
      const signer = await provider.getSigner(); // Get the signer for writing to contract
      // Instantiate contract with SIGNER for write calls
      const farmerRegistryContract = new ethers.Contract(FARMER_REGISTRY_CONTRACT_ADDRESS, FARMER_REGISTRY_ABI, signer);

      const tx = await farmerRegistryContract.registerFarmer(name, location);
      await tx.wait(); // Wait for transaction to be mined

      alert('Farmer registered successfully!');
      checkWalletAndFarmerStatus(); // Re-check status which will navigate
    } catch (error) {
      console.error("Farmer registration error:", error);
      let errorMessage = "Registration failed: Unknown error.";
      if (error.code === 'ACTION_REJECTED') {
          errorMessage = "Transaction rejected by user in MetaMask.";
      } else if (error.info?.error?.message) {
          errorMessage = `Registration failed: ${error.info.error.message}`;
      } else if (error.message) {
          errorMessage = `Registration failed: ${error.message}`;
      }
      alert(errorMessage);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // --- 3D Button Handlers (Called from LandingPage via FarmScene) ---
  const handleFarmerToolsClick = () => {
    if (!currentAccount) {
      alert('Please connect your wallet first.');
      return;
    }
    if (networkId !== HARDHAT_CHAIN_ID) {
      alert(`Please switch your MetaMask to 'Hardhat Localhost' (Chain ID ${HARDHAT_CHAIN_ID}).`);
      return;
    }

    if (!isAddressFarmer) {
      navigate('/farmer-registration');
    } else {
      navigate('/farmer-dashboard');
    }
  };

  const handleBuyerMarketplaceClick = () => {
    if (!currentAccount) {
      alert('Please connect your wallet first.');
      return;
    }
    if (networkId !== HARDHAT_CHAIN_ID) {
      alert(`Please switch your MetaMask to 'Hardhat Localhost' (Chain ID ${HARDHAT_CHAIN_ID}).`);
      return;
    }
    navigate('/buyer-dashboard');
  };

  return (
    <MainLayout
      connectWallet={connectWallet}
      currentAccount={currentAccount}
    >
      <Routes>
        <Route path="/" element={
          isLoadingStatus ? (
            <div className="overlay-content">
              <h2 className="welcome-title">Loading...</h2>
              <p className="welcome-text">Checking your wallet and farmer status.</p>
            </div>
          ) : (
            <LandingPage
              isConnected={!!currentAccount}
              address={currentAccount || 'N/A'}
              onFarmerToolsClick={handleFarmerToolsClick}
              onBuyerMarketplaceClick={handleBuyerMarketplaceClick}
              showFarmerBuyerChoice={showFarmerBuyerChoice}
            />
          )
        } />
        <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
        <Route path="/farmer-registration" element={<FarmerRegistrationForm onSubmit={handleRegisterFarmer} />} />
        <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
        <Route path="*" element={<div className="overlay-content"><h2 className="welcome-title">404 - Page Not Found</h2></div>} />
      </Routes>
    </MainLayout>
  );
}

export default App;