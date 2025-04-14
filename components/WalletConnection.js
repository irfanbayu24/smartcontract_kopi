import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
const distribusi = require('../distribusi');

const WalletConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userRole, setUserRole] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            
            // Get user role
            try {
              const contract = distribusi();
              const role = await contract.methods.roles(accounts[0]).call();
              setUserRole(parseInt(role));
            } catch (error) {
              console.error("Error getting role:", error);
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          
          // Update role when account changes
          try {
            const checkRole = async () => {
              const contract = distribusi();
              const role = await contract.methods.roles(accounts[0]).call();
              setUserRole(parseInt(role));
            };
            checkRole();
          } catch (error) {
            console.error("Error checking role:", error);
          }
        } else {
          setIsConnected(false);
          setWalletAddress('');
          setUserRole(0);
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        
        // Get user role
        try {
          const contract = distribusi();
          const role = await contract.methods.roles(accounts[0]).call();
          setUserRole(parseInt(role));
        } catch (error) {
          console.error("Error getting role:", error);
        }
      } else {
        alert('MetaMask tidak terdeteksi! Silakan instal MetaMask untuk menggunakan fitur ini.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const goToDistribution = () => {
    router.push('/distribusi');
  };
  
  const goToRegister = () => {
    router.push('/register');
  };

  return (
    <>
      {!isConnected ? (
        <button className="metamask-button" onClick={connectWallet}>
          <div className="button-content">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="metamask-icon" />
            <span>Connect Wallet</span>
          </div>
        </button>
      ) : (
        <div className="connected-container">
          <div className="wallet-info">
            <div className="wallet-badge">
              <div className="dot"></div>
              <span>Terhubung: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
            </div>
          </div>
          
          <div className="button-group">
            {userRole === 0 ? (
              <button className="register-button" onClick={goToRegister}>
                Daftar Peran
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-icon">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <button className="tracking-button" onClick={goToDistribution}>
                Pelacakan Distribusi
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-icon">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        button {
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 500;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .metamask-button {
          background: linear-gradient(90deg, #E5B168 0%, #CD853F 100%);
          color: white;
          border: none;
          padding: 0;
          overflow: hidden;
          position: relative;
        }

        .button-content {
          display: flex;
          align-items: center;
          padding: 12px 24px;
          gap: 10px;
        }

        .metamask-icon {
          width: 24px;
          height: 24px;
        }

        .metamask-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(139, 69, 19, 0.3);
        }

        .connected-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .wallet-info {
          margin-bottom: 8px;
        }

        .wallet-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
          padding: 6px 12px;
          border: 1px solid rgba(224, 187, 145, 0.3);
        }

        .dot {
          width: 8px;
          height: 8px;
          background-color: #4CAF50;
          border-radius: 50%;
        }
        
        .button-group {
          display: flex;
          gap: 12px;
        }

        .tracking-button, .register-button {
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          min-width: 200px;
          justify-content: center;
        }
        
        .tracking-button {
          background: linear-gradient(90deg, #8B4513 0%, #C8A27A 100%);
        }
        
        .register-button {
          background: linear-gradient(90deg, #5D4037 0%, #8D6E63 100%);
        }

        .tracking-button:hover, .register-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(139, 69, 19, 0.3);
        }

        .arrow-icon {
          transition: transform 0.2s;
        }

        .tracking-button:hover .arrow-icon, .register-button:hover .arrow-icon {
          transform: translateX(4px);
        }

        @media (max-width: 768px) {
          .connected-container {
            width: 100%;
          }
          
          .button-group {
            width: 100%;
          }
          
          .tracking-button, .register-button {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .button-content {
            padding: 10px 16px;
          }
        }
      `}</style>
    </>
  );
};

export default WalletConnection; 