// src/components/pages/LandingPage.jsx
import React from 'react';
import FarmScene from '../three-d/FarmScene.jsx';

function LandingPage({ isConnected, address, onFarmerToolsClick, onBuyerMarketplaceClick, showFarmerBuyerChoice }) {
  return (
    <>
      {/* 3D Scene as a background element */}
      <div className="scene-background">
        <FarmScene
          onFarmerToolsClick={onFarmerToolsClick}
          onBuyerMarketplaceClick={onBuyerMarketplaceClick}
          showButtons={showFarmerBuyerChoice} // Only show 3D buttons if choices are needed
        />
      </div>

      {/* Overlay content */}
      <div className="overlay-content">
        <h2 className="welcome-title">Welcome to AgriChain</h2>
        <p className="welcome-text">
          Empowering farmers with AI-driven, decentralized agricultural solutions.
          {!isConnected && (
            <span className="not-connected-text">
              Connect your wallet to get started!
            </span>
          )}
          {isConnected && (
            <span className="connected-wallet-text">
              Your wallet is connected: <span style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{address.slice(0, 6)}...{address.slice(-4)}</span>
            </span>
          )}
        </p>
        {/* 3D buttons are now managed by FarmScene based on showButtons prop */}
      </div>
    </>
  );
}

export default LandingPage;