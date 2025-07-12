// src/components/pages/BuyerDashboard.jsx
import React from 'react';

function BuyerDashboard() {
  return (
    <div className="overlay-content">
      <h2 className="welcome-title" style={{color: '#2196F3'}}>Buyer Dashboard</h2>
      <p className="welcome-text">
        Explore the marketplace and find fresh produce directly from farmers.
      </p>
      {/* Add buyer-specific content here */}
      <p style={{fontSize: '1.1em', color: '#B0BEC5', marginTop: '1.5rem'}}>
        (Future: Browse Products, Place Offers, View Orders)
      </p>
    </div>
  );
}

export default BuyerDashboard;