// src/components/pages/FarmerRegistrationForm.jsx
import React, { useState } from 'react';

function FarmerRegistrationForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && location) {
      onSubmit({ name, location });
    } else {
      alert('Please fill in both Name and Location.');
    }
  };

  return (
    <div className="overlay-content">
      <h2 className="welcome-title" style={{color: '#FFC107'}}>Farmer Registration</h2>
      <p className="welcome-text">
        Please provide your details to register as a farmer.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '2rem auto' }}>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Your Location (e.g., Village, District)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          style={inputStyle}
        />
        <button type="submit" style={{ ...buttonStyle, backgroundColor: '#38a169', hoverBackgroundColor: '#2f855a' }}>
          Register as Farmer
        </button>
      </form>
    </div>
  );
}

// Basic inline styles for form elements (you can move these to App.css if preferred)
const inputStyle = {
  padding: '0.8rem',
  borderRadius: '5px',
  border: '1px solid #4a5568',
  backgroundColor: '#2d3748',
  color: '#e2e8f0',
  fontSize: '1.1em',
};

const buttonStyle = {
  padding: '0.8rem',
  borderRadius: '5px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1.1em',
  fontWeight: 'bold',
  transition: 'background-color 0.3s ease',
};

export default FarmerRegistrationForm;