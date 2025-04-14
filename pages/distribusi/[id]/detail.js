import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import ConnectingLines from '../../../components/ConnectingLines';
const distribusi = require('../../../distribusi');
const web3 = require('../../../web3');

const DetailDistribusi = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userRole, setUserRole] = useState(0);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jenisKopi, setJenisKopi] = useState('N/A');
  const [metodePengolahan, setMetodePengolahan] = useState('N/A');
  const [harga, setHarga] = useState(0);
  const [waktuDistribusi, setWaktuDistribusi] = useState('');
  const [destinationPurpose, setDestinationPurpose] = useState('N/A');

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            
            // Get user role from contract
            const contract = distribusi();
            const role = await contract.methods.roles(accounts[0]).call();
            setUserRole(parseInt(role));
            
            if (parseInt(role) === 0) {
              router.push('/register');
            }
          } else {
            router.push('/');
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        router.push('/');
      }
    };
    
    checkConnection();
  }, [router]);

  useEffect(() => {
    const fetchDistribution = async () => {
      if (id && isConnected) {
        try {
          setLoading(true);
          const contract = distribusi();
          // Convert string ID to numeric ID if needed
          const numericId = parseInt(id.toString().replace(/^0x/, ''), 16) || parseInt(id);
          
          // Get distribution data from contract
          const data = await contract.methods.getDistribusi(numericId).call();
          
          // Get status text
          const statusText = await contract.methods.getStatusText(numericId).call();
          
          // Mock data for demo (in real app, these would come from the blockchain)
          const mockJenisKopi = Math.random() > 0.5 ? 'Arabika' : 'Robusta';
          const mockMetodePengolahan = Math.random() > 0.5 ? 'Natural Process' : 'Washed Process';
          const mockHarga = (Math.floor(Math.random() * 500) + 100) * 1000;
          
          // Format date for distribution time
          const now = new Date();
          const formattedDate = now.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit' 
          });
          
          // Format the distribution data
          setDistribution({
            id: numericId,
            petani: data.petani,
            pengepul: data.pengepul,
            pengirim: data.pengirim,
            penerima: data.penerima,
            lokasi: data.lokasi,
            berat: data.berat,
            tanggalPanen: data.tanggalPanen,
            status: parseInt(data.status),
            statusText: statusText,
            jenisKopi: mockJenisKopi,
            metodePengolahan: mockMetodePengolahan,
            harga: mockHarga,
            waktuDistribusi: formattedDate
          });
          
        } catch (error) {
          console.error('Error fetching distribution:', error);
          setError('Gagal memuat data distribusi dari blockchain');
        } finally {
          setLoading(false);
        }
      }
    };
    
    if (id) {
      fetchDistribution();
    }
  }, [id, isConnected]);

  useEffect(() => {
    const getDestinationPurpose = () => {
      if (id) {
        try {
          const savedDistributions = JSON.parse(localStorage.getItem('distributionPurposes') || '{}');
          if (savedDistributions[id]) {
            setDestinationPurpose(savedDistributions[id].destinationPurpose);
          }
        } catch (error) {
          console.error("Error getting destination purpose:", error);
        }
      }
    };

    getDestinationPurpose();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Memuat Data Distribusi...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!distribution) {
    return <div className="error-container">Data distribusi tidak ditemukan</div>;
  }

  // Helper function to format wallet address
  const formatAddress = (address) => {
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      return "Belum ditentukan";
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Helper function to get status progress percentage
  const getStatusProgress = () => {
    const totalSteps = 7; // Total status steps
    return ((distribution.status + 1) / totalSteps) * 100;
  };

  return (
    <div className="container">
      <Head>
        <title>Detail Distribusi Kopi #{id} | Tracking Kopi</title>
        <meta name="description" content="Detail lengkap distribusi kopi" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="main">
        <div className="detail-page">
          <div className="back-navigation">
            <button onClick={() => router.back()} className="back-button">
              ← Kembali
            </button>
          </div>
          
          <div className="detail-header">
            <h1>Detail Distribusi <span className="highlight">#{distribution.id}</span></h1>
            <div className="status-badge">{distribution.statusText}</div>
          </div>
          
          <div className="progress-tracker">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getStatusProgress()}%` }}
              ></div>
            </div>
            <div className="status-markers">
              <div className={`marker ${distribution.status >= 0 ? 'active' : ''}`}>Ditanam</div>
              <div className={`marker ${distribution.status >= 1 ? 'active' : ''}`}>Pengepul</div>
              <div className={`marker ${distribution.status >= 3 ? 'active' : ''}`}>Pengiriman</div>
              <div className={`marker ${distribution.status >= 5 ? 'active' : ''}`}>Sampai</div>
              <div className={`marker ${distribution.status >= 6 ? 'active' : ''}`}>Validasi</div>
            </div>
          </div>
          
          <div className="detail-cards">
            <div className="detail-card product-info">
              <h2>Informasi Produk</h2>
              <div className="card-content">
                <div className="info-item">
                  <span className="label">Jenis Kopi</span>
                  <span className={`value ${distribution.jenisKopi === 'N/A' ? 'not-set' : ''}`}>
                    {distribution.jenisKopi === 'N/A' ? 'Belum Ditentukan (menunggu validasi pengepul)' : distribution.jenisKopi}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Metode Pengolahan</span>
                  <span className={`value ${distribution.metodePengolahan === 'N/A' ? 'not-set' : ''}`}>
                    {distribution.metodePengolahan === 'N/A' ? 'Belum Ditentukan (menunggu validasi pengepul)' : distribution.metodePengolahan}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Lokasi</span>
                  <span className="value">{distribution.lokasi}</span>
                </div>
                <div className="info-item">
                  <span className="label">Berat</span>
                  <span className="value">{distribution.berat} kg</span>
                </div>
                <div className="info-item">
                  <span className="label">Tanggal Panen</span>
                  <span className="value">{distribution.tanggalPanen}</span>
                </div>
                <div className="info-item">
                  <span className="label">Harga</span>
                  <span className="value">Rp {distribution.harga.toLocaleString('id-ID')}</span>
                </div>
                <div className="info-item">
                  <span className="label">Tujuan Pengepul</span>
                  <span className="value">{destinationPurpose !== 'N/A' ? destinationPurpose : 'Tidak ditentukan'}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-card participants">
              <h2>Para Pihak</h2>
              <div className="card-content">
                <div className="participant-flow">
                  <div className="participant-item">
                    <div className="participant-icon petani"></div>
                    <div className="participant-details">
                      <span className="role">Petani</span>
                      <span className="address">{formatAddress(distribution.petani)}</span>
                    </div>
                  </div>
                  
                  <ConnectingLines />
                  
                  <div className="participant-item">
                    <div className="participant-icon pengepul"></div>
                    <div className="participant-details">
                      <span className="role">Pengepul</span>
                      <span className="address">{formatAddress(distribution.pengepul)}</span>
                    </div>
                  </div>
                  
                  <ConnectingLines />
                  
                  <div className="participant-item">
                    <div className="participant-icon pengirim"></div>
                    <div className="participant-details">
                      <span className="role">Pengirim</span>
                      <span className={`address ${distribution.pengirim === "0x0000000000000000000000000000000000000000" ? "pending" : ""}`}>
                        {formatAddress(distribution.pengirim)}
                      </span>
                    </div>
                  </div>
                  
                  <ConnectingLines />
                  
                  <div className="participant-item">
                    <div className="participant-icon penerima"></div>
                    <div className="participant-details">
                      <span className="role">Penerima</span>
                      <span className={`address ${distribution.penerima === "0x0000000000000000000000000000000000000000" ? "pending" : ""}`}>
                        {formatAddress(distribution.penerima)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="detail-card transaction-history">
              <h2>Riwayat Transaksi</h2>
              <div className="card-content">
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-point active"></div>
                    <div className="timeline-content">
                      <div className="timeline-date">14 Jan 2025</div>
                      <div className="timeline-title">Produk Ditanam</div>
                      <div className="timeline-description">Petani menanam biji kopi di {distribution.lokasi}</div>
                    </div>
                  </div>
                  
                  <div className={`timeline-item ${distribution.status >= 1 ? 'active' : ''}`}>
                    <div className={`timeline-point ${distribution.status >= 1 ? 'active' : ''}`}></div>
                    <div className="timeline-content">
                      <div className="timeline-date">14 Apr 2025</div>
                      <div className="timeline-title">Dikirim ke Pengepul</div>
                      <div className="timeline-description">Petani mengirim {distribution.berat} kg kopi ke Pengepul</div>
                    </div>
                  </div>
                  
                  <div className={`timeline-item ${distribution.status >= 2 ? 'active' : ''}`}>
                    <div className={`timeline-point ${distribution.status >= 2 ? 'active' : ''}`}></div>
                    <div className="timeline-content">
                      <div className="timeline-date">16 Apr 2025</div>
                      <div className="timeline-title">Diterima Pengepul</div>
                      <div className="timeline-description">Pengepul menerima dan memvalidasi kopi</div>
                    </div>
                  </div>
                  
                  {distribution.status >= 3 && (
                    <div className="timeline-item active">
                      <div className="timeline-point active"></div>
                      <div className="timeline-content">
                        <div className="timeline-date">18 Apr 2025</div>
                        <div className="timeline-title">Dikirim ke Penerima</div>
                        <div className="timeline-description">Pengepul meneruskan kopi ke pengirim untuk distribusi</div>
                      </div>
                    </div>
                  )}
                  
                  {distribution.status >= 4 && (
                    <div className="timeline-item active">
                      <div className="timeline-point active"></div>
                      <div className="timeline-content">
                        <div className="timeline-date">20 Apr 2025</div>
                        <div className="timeline-title">Dalam Perjalanan</div>
                        <div className="timeline-description">Kopi dalam proses pengiriman ke tujuan akhir</div>
                      </div>
                    </div>
                  )}
                  
                  {distribution.status >= 5 && (
                    <div className="timeline-item active">
                      <div className="timeline-point active"></div>
                      <div className="timeline-content">
                        <div className="timeline-date">22 Apr 2025</div>
                        <div className="timeline-title">Sampai Tujuan</div>
                        <div className="timeline-description">Kopi telah sampai di tujuan dan menunggu validasi</div>
                      </div>
                    </div>
                  )}
                  
                  {distribution.status >= 6 && (
                    <div className="timeline-item active">
                      <div className="timeline-point active"></div>
                      <div className="timeline-content">
                        <div className="timeline-date">23 Apr 2025</div>
                        <div className="timeline-title">Validasi Akhir</div>
                        <div className="timeline-description">Penerima telah memvalidasi penerimaan kopi</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background: #1A120B;
          color: #fff;
          font-family: 'Poppins', sans-serif;
        }
        
        .main {
          padding: 40px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .detail-page {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .back-navigation {
          margin-bottom: 10px;
          margin-top: 80px;
        }
        
        .back-button {
          background: transparent;
          color: #C8A27A;
          border: 1px solid #C8A27A;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
        }
        
        .back-button:hover {
          background: rgba(200, 162, 122, 0.1);
        }
        
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        h1 {
          font-size: 28px;
          font-weight: 600;
          margin: 0;
        }
        
        .highlight {
          color: #E5B168;
        }
        
        .status-badge {
          background: rgba(200, 162, 122, 0.2);
          color: #E5B168;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
        }
        
        .progress-tracker {
          margin-bottom: 30px;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8B4513, #C8A27A);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .status-markers {
          display: flex;
          justify-content: space-between;
        }
        
        .marker {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          position: relative;
        }
        
        .marker.active {
          color: #E5B168;
          font-weight: 500;
        }
        
        .marker::before {
          content: '';
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
        }
        
        .marker.active::before {
          background: #E5B168;
        }
        
        .detail-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 25px;
        }
        
        .detail-card {
          background: rgba(26, 18, 11, 0.95);
          border-radius: 12px;
          border: 1px solid rgba(200, 162, 122, 0.1);
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .detail-card h2 {
          font-size: 18px;
          padding: 20px;
          margin: 0;
          background: rgba(0, 0, 0, 0.2);
          color: #E5B168;
          border-bottom: 1px solid rgba(200, 162, 122, 0.1);
        }
        
        .card-content {
          padding: 20px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .info-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        
        .label {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .value {
          font-weight: 500;
        }
        
        .participant-flow {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .participant-item {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .participant-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .participant-icon.petani {
          background: rgba(139, 69, 19, 0.2);
          color: #8B4513;
        }
        
        .participant-icon.pengepul {
          background: rgba(200, 162, 122, 0.2);
          color: #C8A27A;
        }
        
        .participant-icon.pengirim {
          background: rgba(229, 177, 104, 0.2);
          color: #E5B168;
        }
        
        .participant-icon.penerima {
          background: rgba(209, 139, 71, 0.2);
          color: #D18B47;
        }
        
        .participant-details {
          display: flex;
          flex-direction: column;
        }
        
        .role {
          font-weight: 500;
        }
        
        .address {
          font-family: monospace;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .address.pending {
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
        }
        
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .timeline-item {
          display: flex;
          gap: 15px;
          opacity: 0.5;
        }
        
        .timeline-item.active {
          opacity: 1;
        }
        
        .timeline-point {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          margin-top: 4px;
          position: relative;
        }
        
        .timeline-point.active {
          background: #E5B168;
        }
        
        .timeline-point::after {
          content: '';
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: calc(100% + 16px);
          background: rgba(255, 255, 255, 0.1);
        }
        
        .timeline-item:last-child .timeline-point::after {
          display: none;
        }
        
        .timeline-content {
          flex: 1;
        }
        
        .timeline-date {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 5px;
        }
        
        .timeline-title {
          font-weight: 500;
          margin-bottom: 5px;
        }
        
        .timeline-description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 70vh;
          text-align: center;
        }
        
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top: 3px solid #E5B168;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 50vh;
          text-align: center;
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
          border-radius: 8px;
          padding: 20px;
          margin: 50px auto;
          max-width: 500px;
        }
        
        @media (max-width: 768px) {
          .main {
            padding: 20px 16px;
          }
          
          .detail-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .status-badge {
            align-self: flex-start;
          }
          
          .detail-cards {
            grid-template-columns: 1fr;
          }
          
          .marker {
            font-size: 10px;
          }
          
          .back-navigation {
            margin-top: 100px;
          }
        }
        
        @media (max-width: 480px) {
          h1 {
            font-size: 22px;
          }
          
          .detail-card h2 {
            font-size: 16px;
            padding: 16px;
          }
          
          .info-item {
            margin-bottom: 10px;
            padding-bottom: 10px;
          }
          
          .participant-icon {
            width: 32px;
            height: 32px;
          }
          
          .timeline-title {
            font-size: 14px;
          }
          
          .timeline-description {
            font-size: 12px;
          }
        }
        
        .not-set {
          color: rgba(229, 177, 104, 0.6) !important;
          font-style: italic;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
};

export default DetailDistribusi; 