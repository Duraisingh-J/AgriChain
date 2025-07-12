// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../index.css';
import { BrowserRouter } from 'react-router-dom'; // Keep BrowserRouter for routing

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App /> {/* Directly render App, no WalletConnectProvider here */}
    </BrowserRouter>
  </React.StrictMode>,
);