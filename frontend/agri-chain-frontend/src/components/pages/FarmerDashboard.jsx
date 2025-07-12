// src/components/pages/FarmerDashboard.jsx
import React from 'react';

function FarmerDashboard() {
  return (
    <div className="overlay-content">
      <h2 className="welcome-title" style={{color: '#4CAF50'}}>Farmer Dashboard</h2>
      <p className="welcome-text">
        Welcome, esteemed farmer! Manage your produce, view analytics, and track your agreements here.
      </p>
      {/* Add farmer-specific content here */}
      <p style={{fontSize: '1.1em', color: '#B0BEC5', marginTop: '1.5rem'}}>
        (Future: List Produce, View Earnings, AI Insights)
      </p>
    </div>
  );
}

export default FarmerDashboard;