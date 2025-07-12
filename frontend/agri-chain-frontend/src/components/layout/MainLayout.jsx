// src/components/layout/MainLayout.jsx
import React from 'react';
import '../../App.css'; // Import the App.css for consistent styling

// MainLayout now needs the connectWallet function and currentAccount as props
function MainLayout({ children, connectWallet, currentAccount }) {
  return (
    <div className="app-container">
      {/* Header Section */}
      <header className="header">
        <h1 className="header-title">AgriChain</h1>
        <div className="web3-connect-button-wrapper">
          {/* Display account or Connect Wallet button */}
          {currentAccount ? (
            <span style={{ color: '#90cdf4', fontSize: '1em', marginRight: '10px', textShadow: '0 0 5px rgba(144, 205, 244, 0.5)' }}>
              Connected: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
            </span>
          ) : (
            <button onClick={connectWallet} className="connect-button">
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {children} {/* This is where your page-specific content will render */}
      </main>

      {/* Footer Section */}
      <footer className="footer">
        © {new Date().getFullYear()} AgriChain. All rights reserved.
      </footer>
    </div>
  );
}

export default MainLayout;