import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
const distribusi = require('../../distribusi');
const web3 = require('../../web3');

const DistributionDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userRole, setUserRole] = useState(0); // 0: None, 1: Petani, 2: Pengepul, 3: Pengirim, 4: Penerima
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shipperAddress, setShipperAddress] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  // Helper function to format blockchain addresses
  const formatAddress = (address) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'Belum ditentukan';
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Helper function to determine status CSS class
  const getStatusClass = (status) => {
    switch(status) {
      case 'Dikirim ke Pengepul':
      case 'Diproses':
        return 'processing';
      case 'Dalam Pengiriman':
      case 'Sampai Tujuan':
      case 'Dikirim':
        return 'shipped';
      case 'Diterima':
      case 'Selesai':
        return 'completed';
      default:
        return 'processing';
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            
            // Get user role from contract
            const contract = distribusi();
            const role = await contract.methods.roles(accounts[0]).call();
            const roleValue = parseInt(role);
            
            // If no role is registered, redirect to register page
            if (roleValue === 0) {
              router.push('/register');
              return;
            }
            
            setUserRole(roleValue);
          } else {
            // Not connected, but we'll allow viewing
            setIsConnected(false);
          }
        } catch (error) {
          console.error(error);
          setIsConnected(false);
        }
      } else {
        // MetaMask not installed, but we'll allow viewing
        setIsConnected(false);
      }
    };
    
    checkConnection();
  }, [router]);

  useEffect(() => {
    const fetchDistribution = async () => {
      if (id) {
        try {
          const contract = distribusi();
          // Convert string ID to numeric ID if needed
          const numericId = parseInt(id.toString().replace(/^0x/, ''), 16) || parseInt(id);
          
          // Get distribution data from contract
          const data = await contract.methods.getDistribusi(numericId).call();
          
          // Get status text
          const statusText = await contract.methods.getStatusText(numericId).call();
          
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
            status: data.status,
            statusText: statusText,
            jenisKopi: 'N/A',  // Default values
            metodePengolahan: 'N/A',
            harga: '0',
            waktuDistribusi: '---'
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
  }, [id]);

  const handleValidasiPengepul = async () => {
    if (!shipperAddress) {
      setError('Alamat pengirim harus diisi');
      return;
    }
    
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const contract = distribusi();
      const accounts = await web3.eth.getAccounts();
      
      let successMessage = 'Distribusi berhasil divalidasi sebagai pengepul';
      
      // If a recipient address is provided, set it first
      if (recipientAddress) {
        try {
          // Check if recipient is a registered penerima (role 4)
          const recipientRole = await contract.methods.roles(recipientAddress).call();
          if (parseInt(recipientRole) !== 4) {
            setError('Alamat penerima harus memiliki peran Penerima (role 4) terdaftar di smart contract');
            setActionLoading(false);
            return;
          }
          
          // Set penerima
          const gasEstimatePenerima = await contract.methods.setDistribusiPenerima(id, recipientAddress)
            .estimateGas({ from: accounts[0] });
            
          await contract.methods.setDistribusiPenerima(id, recipientAddress)
            .send({ 
              from: accounts[0],
              gas: Math.floor(Number(gasEstimatePenerima) * 1.2)
            });
            
          successMessage = 'Distribusi berhasil divalidasi dan penerima telah ditetapkan';
        } catch (penerimeError) {
          console.error('Error setting penerima:', penerimeError);
          setError(penerimeError.message || 'Gagal mengatur alamat penerima. Pastikan alamat penerima terdaftar sebagai role Penerima (4)');
          setActionLoading(false);
          return;
        }
      }
      
      // Validate and set shipper
      const gasEstimate = await contract.methods.validasiPengepul(id, shipperAddress)
        .estimateGas({ from: accounts[0] });
      
      await contract.methods.validasiPengepul(id, shipperAddress)
        .send({ 
          from: accounts[0],
          gas: Math.floor(Number(gasEstimate) * 1.2)
        });
      
      setSuccess(successMessage);
      
      // Refresh data after successful validation
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal melakukan validasi distribusi');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleUpdateStatusPengiriman = async (sampaiTujuan) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const contract = distribusi();
      const accounts = await web3.eth.getAccounts();
      
      // Get gas estimate to optimize transaction
      const gasEstimate = await contract.methods.updateStatusPengiriman(id, sampaiTujuan)
        .estimateGas({ from: accounts[0] });
      
      // Get current gas price and reduce it to 90%
      const gasPrice = await web3.eth.getGasPrice();
      const adjustedGasPrice = Math.floor(Number(gasPrice) * 0.9).toString();
      
      await contract.methods.updateStatusPengiriman(id, sampaiTujuan)
        .send({ 
          from: accounts[0],
          gas: Math.floor(Number(gasEstimate) * 1.2), // Add 20% buffer to gas estimate
          gasPrice: adjustedGasPrice // Use reduced gas price
        });
      
      setSuccess(`Status pengiriman berhasil diperbarui menjadi ${sampaiTujuan ? 'Sampai Tujuan' : 'Dalam Perjalanan'}`);
      
      // Refresh data after successful update
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memperbarui status pengiriman');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleValidasiAkhir = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const contract = distribusi();
      const accounts = await web3.eth.getAccounts();
      
      // Get gas estimate to optimize transaction
      const gasEstimate = await contract.methods.validasiAkhirDistribusi(id)
        .estimateGas({ from: accounts[0] });
      
      // Get current gas price and reduce it to 90%
      const gasPrice = await web3.eth.getGasPrice();
      const adjustedGasPrice = Math.floor(Number(gasPrice) * 0.9).toString();
      
      await contract.methods.validasiAkhirDistribusi(id)
        .send({ 
          from: accounts[0],
          gas: Math.floor(Number(gasEstimate) * 1.2), // Add 20% buffer to gas estimate
          gasPrice: adjustedGasPrice // Use reduced gas price
        });
      
      setSuccess('Distribusi berhasil divalidasi sebagai penerima');
      
      // Refresh data after successful validation
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal melakukan validasi akhir distribusi');
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionButtons = () => {
    if (!distribution) return null;
    
    // Based on user role and distribution status, show appropriate buttons
    if (userRole === 2 && distribution.pengepul.toLowerCase() === walletAddress.toLowerCase()) {
      // Pengepul actions
      return (
        <div className="action-section">
          <h3>Tindakan Pengepul</h3>
          
          <div className="form-section">
            <h4>Pilih Partisipan Distribusi</h4>
            
            <div className="form-group">
              <label htmlFor="shipperAddress">Alamat Pengirim <span className="required">*</span></label>
              <input
                type="text"
                id="shipperAddress"
                value={shipperAddress}
                onChange={(e) => setShipperAddress(e.target.value)}
                placeholder="0x..."
              />
              <small>Pengiriman akan diteruskan ke alamat ini untuk transportasi</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="recipientAddress">Alamat Penerima <span className="required">*</span></label>
              <input
                type="text"
                id="recipientAddress"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
              />
              <small>Penerima harus terdaftar sebagai Penerima (role 4) di smart contract</small>
            </div>
            
            <div className="note-box">
              <p><strong>Penting:</strong> Pastikan alamat penerima sudah terdaftar sebagai Penerima (role 4) di smart contract. Jika tidak terdaftar, transaksi akan gagal.</p>
            </div>
          </div>
          
          <button 
            className="btn-primary"
            onClick={handleValidasiPengepul}
            disabled={actionLoading}
          >
            {actionLoading ? <><span className="loader"></span> Memproses...</> : 'Validasi dan Teruskan Distribusi'}
          </button>
        </div>
      );
    } else if (userRole === 3 && distribution.pengirim.toLowerCase() === walletAddress.toLowerCase()) {
      // Pengirim actions
      return (
        <div className="action-section">
          <h3>Tindakan Pengirim</h3>
          <div className="action-buttons">
            <button 
              className="btn-secondary"
              onClick={() => handleUpdateStatusPengiriman(false)}
              disabled={actionLoading}
            >
              {actionLoading ? <><span className="loader"></span> Memproses...</> : 'Dalam Perjalanan'}
            </button>
            <button 
              className="btn-primary"
              onClick={() => handleUpdateStatusPengiriman(true)}
              disabled={actionLoading}
            >
              {actionLoading ? <><span className="loader"></span> Memproses...</> : 'Sampai Tujuan'}
            </button>
          </div>
        </div>
      );
    } else if (userRole === 4) {
      // Penerima actions
      return (
        <div className="action-section">
          <h3>Tindakan Penerima</h3>
          <button 
            className="btn-primary"
            onClick={handleValidasiAkhir}
            disabled={actionLoading}
          >
            {actionLoading ? <><span className="loader"></span> Memproses...</> : 'Validasi Akhir Distribusi'}
          </button>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="distribution-detail-page">
        <Head>
          <title>Proses Distribusi | Sistem Distribusi Kopi</title>
          <meta name="description" content="Detail proses distribusi kopi pada blockchain" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
        
        <Header />
        
        <main>
          <div className="container">
            <div className="detail-header">
              <h1>Proses <span className="gradient-text">Distribusi</span></h1>
              <p>Validasi penerimaan kopi dan pilih pengirim</p>
              <button 
                className="btn-back"
                onClick={() => router.push('/distribusi')}
              >
                ← Kembali
              </button>
            </div>

            {isConnected && (
              <div className="wallet-info">
                <div className="wallet-badge">
                  <div className="dot"></div>
                  <span>Terhubung dengan: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>{success}</span>
              </div>
            )}

            {loading ? (
              <div className="loading-container">
                <div className="loader-large"></div>
                <p>Memuat data distribusi...</p>
              </div>
            ) : !distribution ? (
              <div className="error-container">
                <div className="error-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V12" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16H12.01" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>Data Tidak Ditemukan</h2>
                <p>Tidak dapat memuat data distribusi atau distribusi tidak ada</p>
                <button 
                  className="btn-primary"
                  onClick={() => router.push('/distribusi')}
                >
                  Kembali ke Dashboard
                </button>
              </div>
            ) : (
              <div className="distribution-details">
                {!isConnected && distribution.pengepul !== '0x0000000000000000000000000000000000000000' && (
                  <div className="auth-warning">
                    Anda bukan pengepul yang ditugaskan untuk distribusi ini
                  </div>
                )}

                {isConnected && (userRole === 2 && distribution.pengepul.toLowerCase() !== walletAddress.toLowerCase()) && (
                  <div className="auth-warning">
                    Anda bukan pengepul yang ditugaskan untuk distribusi ini
                  </div>
                )}

                {isConnected && (userRole === 3 && distribution.pengirim.toLowerCase() !== walletAddress.toLowerCase() && 
                   distribution.pengirim !== '0x0000000000000000000000000000000000000000') && (
                  <div className="auth-warning">
                    Anda bukan pengirim yang ditugaskan untuk distribusi ini
                  </div>
                )}

                {isConnected && (userRole === 4 && distribution.penerima.toLowerCase() !== walletAddress.toLowerCase()) && (
                  <div className="auth-warning">
                    Anda bukan penerima yang ditugaskan untuk distribusi ini
                  </div>
                )}

                <div className="detail-container">
                  <div className="distribution-card">
                    <div className="card-header">
                      <h2>{`Distribusi #${distribution.id}`}</h2>
                      <span className={`status status-${getStatusClass(distribution.statusText)}`}>{distribution.statusText}</span>
                    </div>

                    <div className="card-content">
                      <div className="info-group">
                        <div className="info-item">
                          <label>ID Transaksi:</label>
                          <span>{distribution.id}</span>
                        </div>
                        
                        <div className="info-item">
                          <label>Lokasi:</label>
                          <span>{distribution.lokasi}</span>
                        </div>

                        <div className="info-item">
                          <label>Tanggal Panen:</label>
                          <span>{distribution.tanggalPanen}</span>
                        </div>

                        <div className="info-item">
                          <label>Berat:</label>
                          <span>{distribution.berat} kg</span>
                        </div>
                      </div>
                      
                      <div className="participants-section">
                        <h3>Partisipan</h3>
                        <div className="participant-row">
                          <div className="participant-label">Petani:</div>
                          <div className="participant-value">{formatAddress(distribution.petani)}</div>
                        </div>
                        
                        <div className="participant-row">
                          <div className="participant-label">Pengepul:</div>
                          <div className="participant-value">
                            {distribution.pengepul === '0x0000000000000000000000000000000000000000' 
                              ? <span className="not-set">Belum ditentukan</span> 
                              : formatAddress(distribution.pengepul)}
                          </div>
                        </div>
                        
                        <div className="participant-row">
                          <div className="participant-label">Pengirim:</div>
                          <div className="participant-value">
                            {distribution.pengirim === '0x0000000000000000000000000000000000000000' 
                              ? <span className="not-set">Belum ditentukan</span> 
                              : formatAddress(distribution.pengirim)}
                          </div>
                        </div>
                        
                        <div className="participant-row">
                          <div className="participant-label">Penerima:</div>
                          <div className="participant-value">
                            {distribution.penerima === '0x0000000000000000000000000000000000000000' 
                              ? <span className="not-set">Belum ditentukan</span> 
                              : formatAddress(distribution.penerima)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {renderActionButtons()}
              </div>
            )}
          </div>
        </main>
        
        <style jsx>{`
          .distribution-detail-page {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(to bottom, #1A120B, #3C2A21);
            color: white;
            min-height: 100vh;
          }
          
          main {
            padding: 100px 20px 60px;
          }
          
          .container {
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
          }
          
          .detail-header {
            margin-bottom: 30px;
          }
          
          .btn-back {
            background: transparent;
            color: white;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .btn-back:hover {
            text-decoration: underline;
          }
          
          .wallet-info {
            margin-bottom: 30px;
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
          
          .error-message, .success-message {
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .error-message svg, .success-message svg {
            width: 24px;
            height: 24px;
          }
          
          .loading-container {
            text-align: center;
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
          
          @keyframes rotation {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          
          .distribution-details {
            margin-top: 30px;
          }
          
          .auth-warning {
            background: rgba(255, 193, 7, 0.1);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 20px;
          }
          
          .auth-warning p {
            margin: 0;
            font-size: 14px;
          }
          
          .detail-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          
          .distribution-card {
            background: rgba(26, 18, 11, 0.95);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            max-width: 600px;
            margin: 20px auto;
          }
          
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .card-header h2 {
            color: #E5B168;
            margin: 0;
            font-size: 24px;
          }
          
          .status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
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
          
          .card-content {
            margin-bottom: 24px;
          }
          
          .info-group {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .info-item label {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
          }
          
          .info-item span {
            color: white;
            font-size: 16px;
          }
          
          .not-set {
            color: rgba(229, 177, 104, 0.6);
            font-style: italic;
            font-size: 0.9em;
          }
          
          .card-actions {
            display: flex;
            justify-content: flex-end;
          }
          
          .detail-btn {
            background: linear-gradient(90deg, #8B4513 0%, #C8A27A 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: transform 0.2s;
          }
          
          .detail-btn:hover {
            transform: translateY(-2px);
          }
          
          .participants-section {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .participants-section h3 {
            color: #E5B168;
            margin: 0 0 16px 0;
            font-size: 18px;
          }
          
          .participant-row {
            display: flex;
            margin-bottom: 12px;
          }
          
          .participant-label {
            width: 100px;
            color: rgba(255, 255, 255, 0.6);
          }
          
          .participant-value {
            flex: 1;
            font-family: monospace;
            background: rgba(0, 0, 0, 0.2);
            padding: 2px 6px;
            border-radius: 4px;
          }
          
          @media (max-width: 768px) {
            main {
              padding: 80px 16px 40px;
            }
            
            .info-group {
              grid-template-columns: 1fr;
            }
            
            .card-header {
              flex-direction: column;
              align-items: flex-start;
        `}</style>
      </div>
    );
  }

  return (
    <div className="distribution-detail-page">
      <Head>
        <title>Detail Distribusi | Sistem Distribusi Kopi</title>
        <meta name="description" content="Detail distribusi kopi pada blockchain" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <Header />
      
      <main>
        <div className="container">
          <div className="page-header">
            <button 
              className="btn-back"
              onClick={() => router.push('/distribusi')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Kembali ke Daftar
            </button>
            <div className="wallet-info">
              <div className="wallet-badge">
                <div className="dot"></div>
                <span>Terhubung dengan: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
              </div>
            </div>
          </div>
          
          {distribution ? (
            <div className="detail-container">
              <div className="distribution-card">
                <div className="card-header">
                  <h2>{`Distribusi #${distribution.id}`}</h2>
                  <span className={`status status-${getStatusClass(distribution.statusText)}`}>{distribution.statusText}</span>
                </div>

                <div className="card-content">
                  <div className="info-group">
                    <div className="info-item">
                      <label>ID Transaksi:</label>
                      <span>{distribution.id}</span>
                    </div>
                    
                    <div className="info-item">
                      <label>Lokasi:</label>
                      <span>{distribution.lokasi}</span>
                    </div>

                    <div className="info-item">
                      <label>Tanggal Panen:</label>
                      <span>{distribution.tanggalPanen}</span>
                    </div>

                    <div className="info-item">
                      <label>Berat:</label>
                      <span>{distribution.berat} kg</span>
                    </div>
                  </div>
                  
                  <div className="participants-section">
                    <h3>Partisipan</h3>
                    <div className="participant-row">
                      <div className="participant-label">Petani:</div>
                      <div className="participant-value">{formatAddress(distribution.petani)}</div>
                    </div>
                    
                    <div className="participant-row">
                      <div className="participant-label">Pengepul:</div>
                      <div className="participant-value">
                        {distribution.pengepul === '0x0000000000000000000000000000000000000000' 
                          ? <span className="not-set">Belum ditentukan</span> 
                          : formatAddress(distribution.pengepul)}
                      </div>
                    </div>
                    
                    <div className="participant-row">
                      <div className="participant-label">Pengirim:</div>
                      <div className="participant-value">
                        {distribution.pengirim === '0x0000000000000000000000000000000000000000' 
                          ? <span className="not-set">Belum ditentukan</span> 
                          : formatAddress(distribution.pengirim)}
                      </div>
                    </div>
                    
                    <div className="participant-row">
                      <div className="participant-label">Penerima:</div>
                      <div className="participant-value">
                        {distribution.penerima === '0x0000000000000000000000000000000000000000' 
                          ? <span className="not-set">Belum ditentukan</span> 
                          : formatAddress(distribution.penerima)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="error-state">
              <div className="error-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V12" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16H12.01" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Distribusi Tidak Ditemukan</h2>
              <p>Data distribusi dengan ID tersebut tidak ditemukan pada blockchain</p>
              <button 
                className="btn-primary"
                onClick={() => router.push('/distribusi')}
              >
                Kembali ke Daftar Distribusi
              </button>
            </div>
          )}

          {renderActionButtons()}
        </div>
      </main>
      
      <style jsx>{`
        .distribution-detail-page {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(to bottom, #1A120B, #3C2A21);
          color: white;
          min-height: 100vh;
        }
        
        main {
          padding: 100px 20px 60px;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
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
        }
        
        .btn-back:hover {
          background: rgba(224, 187, 145, 0.1);
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
        
        .detail-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .distribution-card {
          background: rgba(26, 18, 11, 0.95);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          max-width: 600px;
          margin: 20px auto;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .card-header h2 {
          color: #E5B168;
          margin: 0;
          font-size: 24px;
        }
        
        .status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
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
        
        .card-content {
          margin-bottom: 24px;
        }
        
        .info-group {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .info-item label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }
        
        .info-item span {
          color: white;
          font-size: 16px;
        }
        
        .not-set {
          color: rgba(229, 177, 104, 0.6);
          font-style: italic;
          font-size: 0.9em;
        }
        
        .card-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        .detail-btn {
          background: linear-gradient(90deg, #8B4513 0%, #C8A27A 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: transform 0.2s;
        }
        
        .detail-btn:hover {
          transform: translateY(-2px);
        }
        
        .error-state {
          text-align: center;
          padding: 60px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .error-icon {
          margin-bottom: 20px;
          opacity: 0.7;
        }
        
        .error-state h2 {
          font-size: 24px;
          margin-bottom: 10px;
          border: none;
        }
        
        .error-state p {
          opacity: 0.7;
          margin-bottom: 24px;
          max-width: 400px;
        }
        
        .loader {
          width: 18px;
          height: 18px;
          border: 2px solid #ffffff;
          border-bottom-color: transparent;
          border-radius: 50%;
          animation: rotation 1.5s linear infinite;
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
          main {
            padding: 80px 16px 40px;
          }
          
          .info-group {
            grid-template-columns: 1fr;
          }
          
          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .wallet-badge {
            font-size: 12px;
          }
          
          .action-section h3 {
            font-size: 16px;
          }
          
          .distribution-card {
            padding: 16px;
            margin: 10px auto;
          }
        }
        
        @media (max-width: 480px) {
          .card-header h2 {
            font-size: 20px;
          }
          
          .info-item span {
            font-size: 14px;
          }
          
          .btn-back {
            font-size: 13px;
            padding: 6px 12px;
          }
        }
        
        .form-section {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .form-section h4 {
          color: #E5B168;
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 16px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 10px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(224, 187, 145, 0.3);
          border-radius: 4px;
          color: white;
          font-family: monospace;
        }
        
        .form-group small {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .required {
          color: #ff4d4d;
        }
        
        .note {
          color: #FFC107;
          font-size: 12px;
          font-style: italic;
          margin-left: 8px;
        }
        
        .note-box {
          background-color: rgba(255, 193, 7, 0.1);
          border-left: 3px solid #FFC107;
          padding: 12px;
          margin-top: 16px;
          border-radius: 4px;
        }
        
        .note-box p {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }
      `}</style>
    </div>
  );
};

export default DistributionDetail; 