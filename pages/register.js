import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
const distribusi = require('../distribusi');
const web3 = require('../web3');

const Register = () => {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [currentRole, setCurrentRole] = useState(0);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            
            // Get current role
            const contract = distribusi();
            const role = await contract.methods.roles(accounts[0]).call();
            setCurrentRole(parseInt(role));
          } else {
            connectWallet();
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    checkConnection();
  }, []);
  
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          
          // Get current role
          const contract = distribusi();
          const role = await contract.methods.roles(accounts[0]).call();
          setCurrentRole(parseInt(role));
        }
      } catch (error) {
        console.error(error);
        setError('Gagal menghubungkan ke wallet. Pastikan MetaMask terinstal dan terbuka.');
      }
    } else {
      setError('MetaMask tidak terdeteksi. Silakan instal MetaMask dan coba lagi.');
    }
  };
  
  const handleRegister = async () => {
    if (!selectedRole) {
      setError('Pilih peran terlebih dahulu');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const contract = distribusi();
      const accounts = await web3.eth.getAccounts();
      
      // Convert role string to number
      const roleValue = parseInt(selectedRole);
      
      // Get gas estimate
      const gasEstimate = await contract.methods.registerRole(roleValue)
        .estimateGas({ from: accounts[0] });
      
      // Get current gas price and reduce it to 90%
      const gasPrice = await web3.eth.getGasPrice();
      const adjustedGasPrice = Math.floor(Number(gasPrice) * 0.9).toString();
      
      // Register role
      await contract.methods.registerRole(roleValue)
        .send({ 
          from: accounts[0],
          gas: Math.floor(Number(gasEstimate) * 1.2),
          gasPrice: adjustedGasPrice
        });
      
      // Update current role after successful registration
      const newRole = await contract.methods.roles(accounts[0]).call();
      setCurrentRole(parseInt(newRole));
      
      setSuccess('Peran berhasil didaftarkan!');
      
      // Redirect to distribution page after 3 seconds
      setTimeout(() => {
        router.push('/distribusi');
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal mendaftarkan peran');
    } finally {
      setLoading(false);
    }
  };
  
  const getRoleName = (roleId) => {
    switch(roleId) {
      case 0: return 'Tidak Terdaftar';
      case 1: return 'Petani';
      case 2: return 'Pengepul';
      case 3: return 'Pengirim';
      case 4: return 'Penerima';
      default: return 'Tidak Diketahui';
    }
  };

  return (
    <div className="register-page">
      <Head>
        <title>Daftar Peran | Sistem Distribusi Kopi</title>
        <meta name="description" content="Daftar peran pada sistem distribusi kopi berbasis blockchain" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <Header />
      
      <main>
        <div className="container">
          <div className="register-container">
            <div className="register-header">
              <h1>Daftar <span className="gradient-text">Peran</span></h1>
              <p>Daftarkan alamat wallet Anda sebagai salah satu peran dalam sistem distribusi kopi</p>
            </div>
            
            {!isConnected ? (
              <div className="wallet-connect">
                <div className="wallet-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12V7H5C3.89543 7 3 6.10457 3 5V19C3 20.1046 3.89543 21 5 21H21V16" stroke="#C8A27A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 12C22 11.4477 21.5523 11 21 11C20.4477 11 20 11.4477 20 12C20 12.5523 20.4477 13 21 13C21.5523 13 22 12.5523 22 12Z" stroke="#C8A27A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 5V3H21V7" stroke="#C8A27A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Hubungkan Wallet</h3>
                <p>Anda perlu menghubungkan wallet untuk mendaftarkan peran</p>
                <button 
                  className="btn-primary"
                  onClick={connectWallet}
                >
                  Hubungkan MetaMask
                </button>
                {error && <div className="error-message">{error}</div>}
              </div>
            ) : (
              <div className="role-registration">
                <div className="wallet-info">
                  <div className="wallet-badge">
                    <div className="dot"></div>
                    <span>Terhubung dengan: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
                  </div>
                </div>
                
                <div className="current-role">
                  <h3>Peran Saat Ini:</h3>
                  <div className="role-badge">
                    {getRoleName(currentRole)}
                  </div>
                </div>
                
                {currentRole === 0 ? (
                  <div className="role-selection">
                    <h3>Pilih Peran:</h3>
                    <div className="role-options">
                      <div 
                        className={`role-option ${selectedRole === '1' ? 'active' : ''}`}
                        onClick={() => setSelectedRole('1')}
                      >
                        <div className="role-icon">🌱</div>
                        <div className="role-name">Petani</div>
                        <div className="role-desc">Produsen kopi yang menanam dan memanen</div>
                      </div>
                      
                      <div 
                        className={`role-option ${selectedRole === '2' ? 'active' : ''}`}
                        onClick={() => setSelectedRole('2')}
                      >
                        <div className="role-icon">🏭</div>
                        <div className="role-name">Pengepul</div>
                        <div className="role-desc">Pengumpul kopi dari petani</div>
                      </div>
                      
                      <div 
                        className={`role-option ${selectedRole === '3' ? 'active' : ''}`}
                        onClick={() => setSelectedRole('3')}
                      >
                        <div className="role-icon">🚚</div>
                        <div className="role-name">Pengirim</div>
                        <div className="role-desc">Transportasi dan pengiriman kopi</div>
                      </div>
                      
                      <div 
                        className={`role-option ${selectedRole === '4' ? 'active' : ''}`}
                        onClick={() => setSelectedRole('4')}
                      >
                        <div className="role-icon">🏪</div>
                        <div className="role-name">Penerima</div>
                        <div className="role-desc">Penerima akhir kopi</div>
                      </div>
                    </div>
                    
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}
                    
                    <div className="register-actions">
                      <button 
                        className="btn-primary"
                        onClick={handleRegister}
                        disabled={loading || !selectedRole}
                      >
                        {loading ? (
                          <><span className="loader"></span> Memproses...</>
                        ) : (
                          'Daftar Sebagai ' + (selectedRole ? getRoleName(parseInt(selectedRole)) : '')
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="already-registered">
                    <div className="success-icon">✓</div>
                    <h2>Anda Sudah Terdaftar!</h2>
                    <p>Anda sudah terdaftar sebagai <strong>{getRoleName(currentRole)}</strong> pada sistem distribusi kopi.</p>
                    <button 
                      className="btn-primary"
                      onClick={() => router.push('/distribusi')}
                    >
                      Lihat Daftar Distribusi
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <style jsx>{`
        .register-page {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(to bottom, #1A120B, #3C2A21);
          color: white;
          min-height: 100vh;
        }
        
        main {
          padding: 120px 20px 60px;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        
        .register-container {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 40px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(224, 187, 145, 0.2);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .register-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 10px;
        }
        
        .gradient-text {
          background: linear-gradient(to right, #C8A27A, #E5B168);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .register-header p {
          opacity: 0.8;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .wallet-connect {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px 0;
          text-align: center;
        }
        
        .wallet-icon {
          margin-bottom: 20px;
          opacity: 0.8;
        }
        
        .wallet-connect h3 {
          font-size: 22px;
          margin-bottom: 10px;
        }
        
        .wallet-connect p {
          opacity: 0.7;
          margin-bottom: 24px;
          max-width: 400px;
        }
        
        .wallet-info {
          margin-bottom: 25px;
        }
        
        .wallet-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.3);
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
        
        .current-role {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
        }
        
        .current-role h3 {
          font-size: 18px;
          margin: 0;
        }
        
        .role-badge {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 20px;
          padding: 6px 16px;
          font-weight: 500;
          border: 1px solid rgba(224, 187, 145, 0.3);
        }
        
        .role-selection h3 {
          font-size: 18px;
          margin-bottom: 15px;
        }
        
        .role-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .role-option {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(224, 187, 145, 0.2);
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .role-option:hover {
          transform: translateY(-5px);
          border-color: rgba(224, 187, 145, 0.5);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .role-option.active {
          border-color: #C8A27A;
          background: rgba(200, 162, 122, 0.1);
          box-shadow: 0 0 0 2px rgba(200, 162, 122, 0.1);
        }
        
        .role-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }
        
        .role-name {
          font-weight: 600;
          font-size: 18px;
          margin-bottom: 5px;
        }
        
        .role-desc {
          font-size: 14px;
          opacity: 0.7;
        }
        
        .register-actions {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
        
        .btn-primary {
          background: linear-gradient(90deg, #8B4513 0%, #C8A27A 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(139, 69, 19, 0.3);
        }
        
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .error-message {
          background: rgba(220, 53, 69, 0.1);
          color: #ff6b6b;
          padding: 12px;
          border-radius: 4px;
          border-left: 3px solid #ff6b6b;
          margin: 20px 0;
        }
        
        .success-message {
          background: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
          padding: 12px;
          border-radius: 4px;
          border-left: 3px solid #4CAF50;
          margin: 20px 0;
        }
        
        .already-registered {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 0;
        }
        
        .success-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(90deg, #8B4513 0%, #C8A27A 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin: 0 auto 20px;
        }
        
        .already-registered h2 {
          font-size: 24px;
          margin-bottom: 10px;
        }
        
        .already-registered p {
          opacity: 0.8;
          margin-bottom: 20px;
        }
        
        .loader {
          width: 18px;
          height: 18px;
          border: 2px solid #ffffff;
          border-bottom-color: transparent;
          border-radius: 50%;
          display: inline-block;
          animation: rotation 1s linear infinite;
        }
        
        @keyframes rotation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 768px) {
          .role-options {
            grid-template-columns: 1fr;
          }
          
          .register-container {
            padding: 30px 20px;
          }
          
          h1 {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
};

export default Register; 