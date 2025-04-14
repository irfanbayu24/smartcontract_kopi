import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../../components/Layout';
import moment from 'moment';
import 'moment/locale/id';
const distribusi = require('../../distribusi');

const PengirimDashboard = () => {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userRole, setUserRole] = useState(0);
  const [distributions, setDistributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if wallet is connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            
            // Check user role
            const contract = distribusi();
            const role = await contract.methods.roles(accounts[0]).call();
            setUserRole(Number(role));
            
            // Redirect if user is not a Pengirim (role 3)
            if (Number(role) !== 3) {
              if (Number(role) === 0) {
                router.push('/register');
              } else {
                router.push('/');
              }
            }
          } else {
            // Not connected, redirect to home
            router.push('/');
          }
        } catch (error) {
          console.error('Error checking connection:', error);
          setError('Error checking wallet connection');
        }
      } else {
        // MetaMask not installed
        router.push('/');
      }
    };
    
    checkConnection();
  }, []);

  // Fetch transporter's distributions
  useEffect(() => {
    const fetchDistributions = async () => {
      if (!isConnected || !walletAddress) return;
      
      try {
        setIsLoading(true);
        const contract = distribusi();
        
        // Get total number of distributions
        const distributionCount = await contract.methods.distribusiCounter().call();
        const distributionsData = [];
        
        // Fetch all distributions and filter those assigned to this transporter
        for (let i = 1; i <= distributionCount; i++) {
          const distributionDetails = await contract.methods.getDistribusi(i).call();
          
          if (distributionDetails.pengirim.toLowerCase() === walletAddress.toLowerCase()) {
            // Get status from distribution details
            const status = Number(distributionDetails.status);
            
            // Get shipment details if available
            let estimatedArrival = 'N/A';
            let shipmentMethod = 'N/A';
            try {
              const storedDetails = localStorage.getItem(`shipment_${i}`);
              if (storedDetails) {
                const parsed = JSON.parse(storedDetails);
                estimatedArrival = parsed.estimatedArrival || 'N/A';
                shipmentMethod = parsed.shipmentMethod || 'N/A';
              }
            } catch (e) {
              console.error('Error retrieving shipment details:', e);
            }
            
            distributionsData.push({
              id: i,
              petani: distributionDetails.petani,
              pengepul: distributionDetails.pengepul,
              pengirim: distributionDetails.pengirim,
              penerima: distributionDetails.penerima,
              lokasi: distributionDetails.lokasi,
              beratInKg: Number(distributionDetails.berat),
              tanggalPanen: distributionDetails.tanggalPanen,
              statusBatch: status,
              estimatedArrival: estimatedArrival,
              shipmentMethod: shipmentMethod
            });
          }
        }
        
        // Sort by status first then by ID
        distributionsData.sort((a, b) => {
          // Priority to status 3 (ready to ship to recipient)
          if (a.statusBatch === 3 && b.statusBatch !== 3) return -1;
          if (a.statusBatch !== 3 && b.statusBatch === 3) return 1;
          
          // Then by ID (newest first)
          return b.id - a.id;
        });
        
        setDistributions(distributionsData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching distributions:', error);
        setError('Error fetching distribution data');
        setIsLoading(false);
      }
    };
    
    fetchDistributions();
  }, [walletAddress, isConnected]);

  // Format wallet address
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get status text
  const getStatusText = (status) => {
    const statusMap = {
      0: 'Ditanam',
      1: 'Dikirim ke Pengepul',
      2: 'Diterima Pengepul',
      3: 'Dikirim ke Penerima',
      4: 'Dalam Perjalanan',
      5: 'Sampai Tujuan',
      6: 'Validasi Akhir'
    };
    return statusMap[status] || 'Unknown';
  };

  // Get status class
  const getStatusClass = (status) => {
    const statusClassMap = {
      0: 'status-created',
      1: 'status-to-collector',
      2: 'status-at-collector',
      3: 'status-to-recipient',
      4: 'status-shipping',
      5: 'status-arrived',
      6: 'status-completed'
    };
    return statusClassMap[status] || '';
  };

  // Format address with ellipsis
  const formatLongAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="dashboard-container">
          <div className="loading">Loading dashboard data...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="dashboard-container">
          <div className="error-message">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard Pengirim | Distribusi Kopi</title>
      </Head>
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard Pengirim</h1>
          <div className="user-info">
            <span className="role-badge">Pengirim</span>
            <span className="wallet-address">{formatAddress(walletAddress)}</span>
          </div>
        </div>

        <div className="dashboard-content">
          <h2>Pengiriman Kopi Saya</h2>
          
          {distributions.length === 0 ? (
            <div className="no-data">
              <p>Anda belum memiliki distribusi kopi yang ditugaskan kepada Anda.</p>
            </div>
          ) : (
            <div className="distributions-list">
              {distributions.map((distribution) => (
                <div className={`distribution-card ${distribution.statusBatch === 3 ? 'needs-action' : ''}`} key={distribution.id}>
                  <div className="distribution-header">
                    <h3>ID Distribusi: {distribution.id}</h3>
                    <span className={`status-badge ${getStatusClass(distribution.statusBatch)}`}>
                      {getStatusText(distribution.statusBatch)}
                    </span>
                  </div>
                  
                  <div className="distribution-details">
                    <div className="detail-row">
                      <span className="detail-label">Lokasi:</span>
                      <span className="detail-value">{distribution.lokasi}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Tanggal Panen:</span>
                      <span className="detail-value">{distribution.tanggalPanen}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Metode Pengiriman:</span>
                      <span className="detail-value">{distribution.shipmentMethod}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Berat:</span>
                      <span className="detail-value">{distribution.beratInKg} Kg</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Pengepul:</span>
                      <span className="detail-value" title={distribution.pengepul}>{formatLongAddress(distribution.pengepul)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Penerima:</span>
                      <span className="detail-value" title={distribution.penerima}>{formatLongAddress(distribution.penerima)}</span>
                    </div>
                    {distribution.statusBatch >= 3 && (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">Estimasi Kedatangan:</span>
                          <span className="detail-value">{distribution.estimatedArrival}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="distribution-footer">
                    {distribution.statusBatch === 3 && (
                      <div className="action-prompt">Siap untuk dikirim ke tujuan!</div>
                    )}
                    
                    {(distribution.statusBatch === 3 || distribution.statusBatch === 4) && (
                      <button 
                        className="btn-confirm"
                        onClick={() => router.push(`/pengirim/konfirmasi/${distribution.id}`)}
                      >
                        {distribution.statusBatch === 3 ? 'Mulai Pengiriman' : 'Konfirmasi Sampai'}
                      </button>
                    )}
                    
                    <button 
                      className="btn-view"
                      onClick={() => router.push(`/distribusi/${distribution.id}`)}
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 20px;
        }

        .dashboard-header h1 {
          color: #3C2A21;
          margin: 0;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .role-badge {
          background: #4169E1;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
        }

        .wallet-address {
          font-family: monospace;
          background: #f5f5f5;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 14px;
        }

        .dashboard-content h2 {
          color: #3C2A21;
          margin-bottom: 20px;
        }

        .no-data {
          text-align: center;
          background: #f9f9f9;
          padding: 40px;
          border-radius: 8px;
        }

        .no-data p {
          color: #666;
        }

        .distributions-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .distribution-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: transform 0.3s ease;
        }

        .distribution-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
        }

        .needs-action {
          border: 2px solid #008080;
          box-shadow: 0 0 15px rgba(0, 128, 128, 0.4);
        }

        .distribution-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
        }

        .distribution-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .status-badge {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }

        .status-created {
          background: #FFA500;
        }

        .status-to-collector {
          background: #008080;
        }

        .status-at-collector {
          background: #4169E1;
        }

        .status-to-recipient {
          background: #006400;
        }

        .status-shipping {
          background: #4169E1;
        }

        .status-arrived {
          background: #006400;
        }

        .status-completed {
          background: #006400;
        }

        .distribution-details {
          padding: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .detail-label {
          font-weight: 500;
          color: #666;
        }

        .detail-value {
          color: #333;
          max-width: 60%;
          text-align: right;
          word-break: break-all;
        }

        .distribution-footer {
          padding: 15px 20px;
          border-top: 1px solid #e0e0e0;
          text-align: right;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .action-prompt {
          color: #008080;
          font-weight: 500;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.7;
          }
        }

        .btn-view {
          background: transparent;
          color: #4169E1;
          border: 1px solid #4169E1;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-view:hover {
          background: #4169E1;
          color: white;
        }

        .loading, .error-message {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #666;
        }

        .error-message {
          color: #d32f2f;
        }

        .btn-confirm {
          background: #008080;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-confirm:hover {
          background: #006400;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .distributions-list {
            grid-template-columns: 1fr;
          }
          
          .distribution-footer {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
        }
      `}</style>
    </Layout>
  );
};

export default PengirimDashboard; 