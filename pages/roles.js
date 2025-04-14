import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
const distribusi = require('../distribusi');
const web3 = require('../web3');

const RolesList = () => {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [roles, setRoles] = useState({
    petani: [],
    pengepul: [],
    pengirim: [],
    penerima: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            
            // Check if user has a registered role
            const contract = distribusi();
            const role = await contract.methods.roles(accounts[0]).call();
            
            // If no role is registered, redirect to register page
            if (parseInt(role) === 0) {
              router.push('/register');
            }
          } else {
            // Redirect if not connected
            router.push('/');
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        // Redirect if MetaMask is not installed
        router.push('/');
      }
    };
    
    checkConnection();

    // Fetch users with roles from blockchain
    const fetchRolesFromBlockchain = async () => {
      try {
        setLoading(true);
        const contract = distribusi();
        
        // Metode baru: Coba ambil semua alamat yang sudah terdaftar dengan cara memindai semua transaksi pengiriman
        // dan kemudian memeriksa role masing-masing alamat
        
        // 1. Mendapatkan daftar alamat dengan cara mendapatkan semua alamat yang pernah berinteraksi dengan smart contract
        const accounts = await web3.eth.getAccounts();
        let allAddresses = new Set();
        
        // Tambahkan alamat yang aktif saat ini
        if (walletAddress) {
          allAddresses.add(walletAddress.toLowerCase());
        }
        
        // 2. Ambil juga alamat dari distribusi yang sudah ada (seperti cara sebelumnya)
        const distributionCount = await contract.methods.distribusiCounter().call();

        for (let i = 1; i <= distributionCount; i++) {
          try {
            const data = await contract.methods.getDistribusi(i).call();
            
            if (data.petani && data.petani !== '0x0000000000000000000000000000000000000000') {
              allAddresses.add(data.petani.toLowerCase());
            }
            
            if (data.pengepul && data.pengepul !== '0x0000000000000000000000000000000000000000') {
              allAddresses.add(data.pengepul.toLowerCase());
            }
            
            if (data.pengirim && data.pengirim !== '0x0000000000000000000000000000000000000000') {
              allAddresses.add(data.pengirim.toLowerCase());
            }
            
            if (data.penerima && data.penerima !== '0x0000000000000000000000000000000000000000') {
              allAddresses.add(data.penerima.toLowerCase());
            }
          } catch (err) {
            console.error(`Error fetching distribution ${i}:`, err);
          }
        }

        // 3. Tambahkan alamat hardcoded untuk pengujian jika diperlukan
        // Contoh alamat pengepul, pengirim, dan penerima untuk pengujian
        const testAddresses = [
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // pengepul test
          '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // pengirim test
          '0x90F79bf6EB2c4f870365E785982E1f101E93b906'  // penerima test
        ];
        
        testAddresses.forEach(address => {
          allAddresses.add(address.toLowerCase());
        });
        
        // 4. Cek role untuk semua alamat yang ditemukan
        const verifiedRoles = {
          petani: [],
          pengepul: [],
          pengirim: [],
          penerima: []
        };
        
        // Verifikasi role untuk semua alamat yang ditemukan
        for (const address of allAddresses) {
          try {
            const role = await contract.methods.roles(address).call();
            const roleInt = parseInt(role);
            
            if (roleInt === 1) {
              verifiedRoles.petani.push(address);
            } else if (roleInt === 2) {
              verifiedRoles.pengepul.push(address);
            } else if (roleInt === 3) {
              verifiedRoles.pengirim.push(address);
            } else if (roleInt === 4) {
              verifiedRoles.penerima.push(address);
            }
          } catch (err) {
            console.error(`Error verifying role for ${address}:`, err);
          }
        }
        
        setRoles(verifiedRoles);
        setLoading(false);
        
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data role pengguna dari blockchain');
        setLoading(false);
      }
    };

    if (isConnected) {
      fetchRolesFromBlockchain();
    }
  }, [router, isConnected, walletAddress]);

  // Helper function untuk memformat alamat wallet
  const formatAddress = (address) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  // Helper function untuk mendapatkan label role dari ID
  const getRoleName = (roleId) => {
    switch(roleId) {
      case 1: return 'Petani';
      case 2: return 'Pengepul';
      case 3: return 'Pengirim';
      case 4: return 'Penerima';
      default: return 'Tidak Terdaftar';
    }
  };

  // Helper function untuk mendapatkan warna role
  const getRoleColor = (roleId) => {
    switch(roleId) {
      case 1: return '#8B4513'; // Petani - coklat tua
      case 2: return '#C8A27A'; // Pengepul - coklat muda
      case 3: return '#E5B168'; // Pengirim - coklat keemasan
      case 4: return '#D18B47'; // Penerima - coklat oranye
      default: return '#6c757d'; // Default - abu-abu
    }
  };

  return (
    <div className="roles-page">
      <Head>
        <title>Daftar Role Terdaftar | Sistem Distribusi Kopi</title>
        <meta name="description" content="Daftar pengguna yang terdaftar dalam sistem distribusi kopi" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Header />

      <main>
        <div className="container">
          <div className="page-header">
            <div>
              <h1>Daftar Role <span className="gradient-text">Terdaftar</span></h1>
              <p>Lihat semua pengguna yang terdaftar dalam rantai distribusi kopi</p>
            </div>
          </div>

          <div className="wallet-info">
            <div className="wallet-badge">
              <div className="dot"></div>
              <span>Terhubung dengan: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loader-large"></div>
              <p>Memuat data role pengguna dari blockchain...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
            </div>
          ) : (
            <div className="roles-container">
              <div className="role-section">
                <div className="role-header">
                  <div className="role-badge" style={{ backgroundColor: 'rgba(139, 69, 19, 0.2)', color: '#8B4513' }}>
                    Petani
                  </div>
                  <span className="role-count">{roles.petani.length} terdaftar</span>
                </div>
                <div className="role-list">
                  {roles.petani.length === 0 ? (
                    <div className="empty-role">Belum ada Petani yang terdaftar</div>
                  ) : (
                    roles.petani.map((address, index) => (
                      <div className="role-item" key={`petani-${index}`}>
                        <div className="address-icon" style={{ backgroundColor: 'rgba(139, 69, 19, 0.2)' }}>
                          <span>{address.substring(2, 4)}</span>
                        </div>
                        <div className="address-details">
                          <div className="address">{formatAddress(address)}</div>
                          <div className="role-tag">Petani</div>
                        </div>
                        <button className="copy-btn" onClick={() => navigator.clipboard.writeText(address)}>
                          Salin
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="role-section">
                <div className="role-header">
                  <div className="role-badge" style={{ backgroundColor: 'rgba(200, 162, 122, 0.2)', color: '#C8A27A' }}>
                    Pengepul
                  </div>
                  <span className="role-count">{roles.pengepul.length} terdaftar</span>
                </div>
                <div className="role-list">
                  {roles.pengepul.length === 0 ? (
                    <div className="empty-role">Belum ada Pengepul yang terdaftar</div>
                  ) : (
                    roles.pengepul.map((address, index) => (
                      <div className="role-item" key={`pengepul-${index}`}>
                        <div className="address-icon" style={{ backgroundColor: 'rgba(200, 162, 122, 0.2)' }}>
                          <span>{address.substring(2, 4)}</span>
                        </div>
                        <div className="address-details">
                          <div className="address">{formatAddress(address)}</div>
                          <div className="role-tag">Pengepul</div>
                        </div>
                        <button className="copy-btn" onClick={() => navigator.clipboard.writeText(address)}>
                          Salin
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="role-section">
                <div className="role-header">
                  <div className="role-badge" style={{ backgroundColor: 'rgba(229, 177, 104, 0.2)', color: '#E5B168' }}>
                    Pengirim
                  </div>
                  <span className="role-count">{roles.pengirim.length} terdaftar</span>
                </div>
                <div className="role-list">
                  {roles.pengirim.length === 0 ? (
                    <div className="empty-role">Belum ada Pengirim yang terdaftar</div>
                  ) : (
                    roles.pengirim.map((address, index) => (
                      <div className="role-item" key={`pengirim-${index}`}>
                        <div className="address-icon" style={{ backgroundColor: 'rgba(229, 177, 104, 0.2)' }}>
                          <span>{address.substring(2, 4)}</span>
                        </div>
                        <div className="address-details">
                          <div className="address">{formatAddress(address)}</div>
                          <div className="role-tag">Pengirim</div>
                        </div>
                        <button className="copy-btn" onClick={() => navigator.clipboard.writeText(address)}>
                          Salin
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="role-section">
                <div className="role-header">
                  <div className="role-badge" style={{ backgroundColor: 'rgba(209, 139, 71, 0.2)', color: '#D18B47' }}>
                    Penerima
                  </div>
                  <span className="role-count">{roles.penerima.length} terdaftar</span>
                </div>
                <div className="role-list">
                  {roles.penerima.length === 0 ? (
                    <div className="empty-role">Belum ada Penerima yang terdaftar</div>
                  ) : (
                    roles.penerima.map((address, index) => (
                      <div className="role-item" key={`penerima-${index}`}>
                        <div className="address-icon" style={{ backgroundColor: 'rgba(209, 139, 71, 0.2)' }}>
                          <span>{address.substring(2, 4)}</span>
                        </div>
                        <div className="address-details">
                          <div className="address">{formatAddress(address)}</div>
                          <div className="role-tag">Penerima</div>
                        </div>
                        <button className="copy-btn" onClick={() => navigator.clipboard.writeText(address)}>
                          Salin
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .roles-page {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(to bottom, #1A120B, #3C2A21);
          color: white;
          min-height: 100vh;
        }

        main {
          padding: 120px 20px 60px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .page-header p {
          opacity: 0.8;
          margin: 0;
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

        .roles-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
          gap: 24px;
        }

        .role-section {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(224, 187, 145, 0.2);
        }

        .role-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(224, 187, 145, 0.1);
        }

        .role-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }

        .role-count {
          font-size: 14px;
          opacity: 0.7;
        }

        .role-list {
          padding: 16px;
        }

        .role-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border-radius: 8px;
          transition: background-color 0.2s;
          margin-bottom: 8px;
        }

        .role-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .address-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: monospace;
          font-weight: 600;
          font-size: 16px;
        }

        .address-details {
          flex: 1;
        }

        .address {
          font-family: monospace;
          font-size: 15px;
        }

        .role-tag {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 2px;
        }

        .copy-btn {
          background: transparent;
          color: #E5B168;
          border: 1px solid rgba(229, 177, 104, 0.3);
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-btn:hover {
          background: rgba(229, 177, 104, 0.1);
        }

        .empty-role {
          text-align: center;
          padding: 20px;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
        }

        .loader-large {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(224, 187, 145, 0.3);
          border-top-color: #C8A27A;
          border-radius: 50%;
          animation: rotation 1.5s infinite linear;
          margin-bottom: 20px;
        }

        .error-message {
          background: rgba(220, 53, 69, 0.1);
          color: #ff6b6b;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          border-left: 3px solid #ff6b6b;
          margin: 30px auto;
          max-width: 500px;
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
          .roles-container {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          h1 {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
};

export default RolesList; 