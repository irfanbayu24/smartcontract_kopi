import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
const distribusi = require('../../distribusi');
const web3 = require('../../web3');

const DistributionList = () => {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sample data for demonstration
  const sampleDistributions = [
    {
      id: '0x1a2b3c4d5e6f',
      farmName: 'Perkebunan Kopi Makmur',
      location: 'Bandung, Jawa Barat',
      harvestDate: '2023-10-15',
      coffeeType: 'Arabica',
      processingMethod: 'Washed Process',
      batchWeight: '120',
      price: '175000',
      status: 'Diproses',
      timestamp: '2023-10-20T08:30:00'
    },
    {
      id: '0x2b3c4d5e6f7g',
      farmName: 'Kebun Kopi Sejahtera',
      location: 'Aceh Gayo',
      harvestDate: '2023-09-28',
      coffeeType: 'Robusta',
      processingMethod: 'Natural Process',
      batchWeight: '85',
      price: '145000',
      status: 'Dikirim',
      timestamp: '2023-10-02T10:15:00'
    },
    {
      id: '0x3c4d5e6f7g8h',
      farmName: 'Kopi Nusantara',
      location: 'Toraja, Sulawesi Selatan',
      harvestDate: '2023-10-05',
      coffeeType: 'Arabica',
      processingMethod: 'Honey Process',
      batchWeight: '100',
      price: '210000',
      status: 'Selesai',
      timestamp: '2023-10-12T14:45:00'
    }
  ];

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
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
            // Not connected but allow viewing
            setIsConnected(false);
          }
        } catch (error) {
          console.error(error);
          setIsConnected(false);
        }
      } else {
        // MetaMask not installed but allow viewing
        setIsConnected(false);
      }
      
      // Load distributions regardless of connection status
      loadDistributions();
    };
    
    // Load data from blockchain
    const loadDistributions = async () => {
      try {
        const contract = distribusi();
        const counter = await contract.methods.distribusiCounter().call();
        
        const distributionsData = [];
        // Fetch all distributions, start from 1 as the IDs start from 1
        for (let i = 1; i <= counter; i++) {
          const data = await contract.methods.getDistribusi(i).call();
          const statusText = await contract.methods.getStatusText(i).call();
          
          // Convert blockchain data to our format
          distributionsData.push({
            id: i.toString(),
            farmName: `Distribusi #${i}`, // Placeholder as the contract doesn't store farm name
            location: data.lokasi,
            harvestDate: data.tanggalPanen,
            coffeeType: 'N/A', // Not stored in contract
            processingMethod: 'N/A', // Not stored in contract
            batchWeight: data.berat,
            price: '0', // Not stored in contract
            status: statusText,
            timestamp: new Date().toISOString() // Not stored in contract, using current time as placeholder
          });
        }
        
        setDistributions(distributionsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading distributions:', error);
        // If there's an error, we'll show sample data as fallback
        setTimeout(() => {
          setDistributions(sampleDistributions);
          setLoading(false);
        }, 1500);
      }
    };
    
    checkConnection();
  }, [router]);

  const getStatusClass = (status) => {
    switch(status) {
      case 'Diproses':
        return 'status-processing';
      case 'Dikirim':
        return 'status-shipped';
      case 'Selesai':
        return 'status-completed';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatTimestamp = (timestamp) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(timestamp).toLocaleDateString('id-ID', options) + ' ' + 
           new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="distribution-list-page">
      <Head>
        <title>Daftar Distribusi | Sistem Distribusi Kopi</title>
        <meta name="description" content="Daftar distribusi kopi pada blockchain" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Header />

      <main>
        <div className="container">
          <div className="page-header">
            <div>
              <h1>Daftar Distribusi <span className="gradient-text">Kopi</span></h1>
              <p>Lihat dan lacak semua distribusi kopi yang tercatat pada blockchain</p>
            </div>
            {isConnected && (
              <button 
                className="btn-primary add-button"
                onClick={() => router.push('/distribusi/new')}
              >
                + Tambah Distribusi Baru
              </button>
            )}
          </div>

          {isConnected && (
            <div className="wallet-info">
              <div className="wallet-badge">
                <div className="dot"></div>
                <span>Terhubung dengan: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="loader-large"></div>
              <p>Memuat data distribusi...</p>
            </div>
          ) : distributions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#C8A27A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 10H9.01" stroke="#C8A27A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 10H15.01" stroke="#C8A27A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.5 15C10.1667 16.1667 11.3 17 12 17C12.7 17 13.8333 16.1667 14.5 15" stroke="#C8A27A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Belum Ada Distribusi</h2>
              <p>Belum ada distribusi kopi yang tercatat pada blockchain</p>
              {isConnected && (
                <button 
                  className="btn-primary"
                  onClick={() => router.push('/distribusi/new')}
                >
                  Tambah Distribusi Baru
                </button>
              )}
            </div>
          ) : (
            <div className="distributions-grid">
              {distributions.map((item) => (
                <div className="distribution-card" key={item.id}
                     onClick={() => router.push(`/distribusi/${item.id}`)}>
                  <div className="card-header">
                    <h3>{item.farmName}</h3>
                    <div className={`status-badge ${getStatusClass(item.status)}`}>
                      {item.status}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="detail-row">
                      <div className="detail-label">ID Transaksi:</div>
                      <div className="detail-value id-value">{item.id}</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Lokasi:</div>
                      <div className="detail-value">{item.location}</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Jenis Kopi:</div>
                      <div className="detail-value">{item.coffeeType === 'N/A' ? <span className="not-set">Belum Ditentukan</span> : item.coffeeType}</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Metode Pengolahan:</div>
                      <div className="detail-value">{item.processingMethod === 'N/A' ? <span className="not-set">Belum Ditentukan</span> : item.processingMethod}</div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">Tanggal Panen:</div>
                      <div className="detail-value">{formatDate(item.harvestDate)}</div>
                    </div>
                    <div className="details-group">
                      <div className="detail-row">
                        <div className="detail-label">Berat:</div>
                        <div className="detail-value">{item.batchWeight} kg</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Harga/kg:</div>
                        <div className="detail-value">Rp {parseInt(item.price).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                    <div className="detail-row timestamp">
                      <div className="detail-label">Waktu Distribusi:</div>
                      <div className="detail-value">{formatTimestamp(item.timestamp)}</div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button 
                      className="btn-secondary view-button"
                      onClick={() => router.push(`/distribusi/${item.id}`)}
                    >
                      Lihat Detail
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .distribution-list-page {
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

        .add-button {
          white-space: nowrap;
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

        .distributions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .distribution-card {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          border: 1px solid rgba(224, 187, 145, 0.2);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .distribution-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        .card-header {
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(224, 187, 145, 0.1);
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .status-processing {
          background-color: rgba(255, 193, 7, 0.2);
          color: #FFC107;
        }

        .status-shipped {
          background-color: rgba(33, 150, 243, 0.2);
          color: #2196F3;
        }

        .status-completed {
          background-color: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        .card-body {
          padding: 20px;
        }

        .detail-row {
          display: flex;
          margin-bottom: 10px;
        }

        .detail-label {
          width: 45%;
          font-weight: 500;
          color: #C8A27A;
        }

        .detail-value {
          width: 55%;
        }

        .id-value {
          font-family: monospace;
          background: rgba(0, 0, 0, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .details-group {
          display: flex;
          gap: 20px;
          margin: 12px 0;
          padding: 12px 0;
          border-top: 1px dashed rgba(224, 187, 145, 0.2);
          border-bottom: 1px dashed rgba(224, 187, 145, 0.2);
        }

        .details-group .detail-row {
          margin-bottom: 0;
        }

        .timestamp {
          margin-top: 10px;
          font-size: 14px;
          opacity: 0.7;
        }

        .card-footer {
          padding: 16px 20px;
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid rgba(224, 187, 145, 0.1);
        }

        .btn-secondary {
          background: transparent;
          color: white;
          border: 1px solid rgba(224, 187, 145, 0.5);
          padding: 8px 16px;
          border-radius: 4px;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-secondary:hover {
          background: rgba(224, 187, 145, 0.1);
        }

        .view-button svg {
          transition: transform 0.2s;
        }

        .view-button:hover svg {
          transform: translateX(4px);
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

        .empty-state {
          text-align: center;
          padding: 60px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .empty-icon {
          margin-bottom: 20px;
          opacity: 0.7;
        }

        .empty-state h2 {
          font-size: 24px;
          margin-bottom: 10px;
        }

        .empty-state p {
          opacity: 0.7;
          margin-bottom: 24px;
          max-width: 400px;
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
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .add-button {
            width: 100%;
            justify-content: center;
          }

          .distributions-grid {
            grid-template-columns: 1fr;
          }

          h1 {
            font-size: 26px;
          }
        }

        .not-set {
          color: rgba(229, 177, 104, 0.6);
          font-style: italic;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
};

export default DistributionList; 