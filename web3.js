// web3.js - Using Web3.js version 4.x syntax
const { Web3 } = require('web3');

let web3;

// Initialize web3 on the client-side
if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
  // We are in the browser with MetaMask available
  web3 = new Web3(window.ethereum);
} else {
  // We're on the server or user doesn't have MetaMask
  // Set up a provider using Infura
  const provider = new Web3.providers.HttpProvider(
    "https://sepolia.infura.io/v3/63e0f05ffd18417197c7a8a04e56bd16"
  );
  web3 = new Web3(provider);
}

module.exports = web3; 