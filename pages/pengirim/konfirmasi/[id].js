import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
const distribusi = require('../../../distribusi');
const web3 = require('../../../web3');

const KonfirmasiPengiriman = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userRole, setUserRole] = useState(0);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shipmentStatus, setShipmentStatus] = useState('');
  const [penerimaNama, setPenerimaNama] = useState('');
  const [penerimaTelp, setPenerimaTelp] = useState('');
  const [tglTerima, setTglTerima] = useState('');
  const [buktiTerima, setBuktiTerima] = useState(null);
  const [keterangan, setKeterangan] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  // Check connection and access
  useEffect(() => {
    if (!router.isReady) return;

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
            const roleValue = parseInt(role);
            setUserRole(roleValue);
            
            // If not a Pengirim (role 3), redirect
            if (roleValue !== 3) {
              setError('Anda bukan pengirim. Redirecting...');
              setTimeout(() => {
                router.push('/');
              }, 3000);
              return;
            }
            
            // Load distribution data
            fetchDistributionData();
          } else {
            // Not connected, redirect to home
            router.push('/');
          }
        } catch (error) {
          console.error('Error checking connection:', error);
          setError('Error checking wallet connection');
          setLoading(false);
        }
      } else {
        // MetaMask not installed
        router.push('/');
      }
    };
    
    checkConnection();
  }, [router.isReady, router.query]);

  // Fetch distribution data
  const fetchDistributionData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get ID from router query
      const currentId = router.query.id;
      
      if (!currentId) {
        setError('ID distribusi tidak tersedia');
        setLoading(false);
        return;
      }
      
      const contract = distribusi();
      
      // Convert ID to numeric
      let numericId = parseInt(currentId);
      if (isNaN(numericId) || numericId <= 0) {
        setError('ID distribusi tidak valid');
        setLoading(false);
        return;
      }
      
      // Get distribution counter to verify ID exists
      const counter = await contract.methods.distribusiCounter().call();
      if (numericId > Number(counter)) {
        setError(`Distribusi dengan ID ${numericId} tidak ditemukan`);
        setLoading(false);
        return;
      }
      
      // Fetch distribution details
      const data = await contract.methods.getDistribusi(numericId).call();
      
      // Verify shipper is the current wallet
      if (data.pengirim.toLowerCase() !== walletAddress.toLowerCase()) {
        setError('Anda bukan pengirim yang ditugaskan untuk distribusi ini');
        setLoading(false);
        return;
      }
      
      // Verify status is valid for this operation (3 or 4)
      const currentStatus = Number(data.status);
      if (currentStatus !== 3 && currentStatus !== 4) {
        setError(`Status distribusi (${currentStatus}) tidak valid untuk konfirmasi pengiriman`);
        setLoading(false);
        return;
      }
      
      // Format distribution data
      const formattedData = {
        id: numericId,
        petani: data.petani,
        pengepul: data.pengepul,
        pengirim: data.pengirim,
        penerima: data.penerima,
        lokasi: data.lokasi,
        beratKg: Number(data.berat),
        tanggalPanen: data.tanggalPanen,
        status: currentStatus,
        statusText: getStatusText(currentStatus)
      };
      
      // Get existing shipment details if any
      try {
        const storedDetails = localStorage.getItem(`shipment_${numericId}`);
        if (storedDetails) {
          const parsed = JSON.parse(storedDetails);
          setPenerimaNama(parsed.penerimaNama || '');
          setPenerimaTelp(parsed.penerimaTelp || '');
          setTglTerima(parsed.tglTerima || '');
          setKeterangan(parsed.keterangan || '');
          setPreviewUrl(parsed.buktiTerimaUrl || '');
        }
      } catch (e) {
        console.error('Error loading saved shipment details:', e);
      }
      
      setDistribution(formattedData);
      setShipmentStatus(currentStatus === 3 ? 'sedang_dikirim' : 'sudah_sampai');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching distribution:', err);
      setError('Gagal memuat data distribusi: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBuktiTerima(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
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

  // Handle form submission
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    
    if (shipmentStatus === 'sudah_sampai' && (!penerimaNama || !tglTerima)) {
      setError('Mohon lengkapi data penerima dan tanggal diterima');
      return;
    }
    
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const contract = distribusi();
      const accounts = await web3.eth.getAccounts();
      const numericId = parseInt(id);
      
      // Determine if the status update is for 'in transit' or 'arrived'
      const arrivedAtDestination = shipmentStatus === 'sudah_sampai';
      
      // Prepare local storage data (proof of delivery)
      const shipmentDetails = {
        penerimaNama,
        penerimaTelp, 
        tglTerima,
        keterangan,
        buktiTerimaUrl: previewUrl,
        updatedAt: new Date().toISOString(),
        confirmedBy: walletAddress,
        arrivedAtDestination
      };
      
      // Save to localStorage
      localStorage.setItem(`shipment_${numericId}`, JSON.stringify(shipmentDetails));
      
      // Call smart contract to update status
      const gasEstimate = await contract.methods.updateStatusPengiriman(
        numericId,
        arrivedAtDestination
      ).estimateGas({ from: accounts[0] });
      
      // Send transaction
      await contract.methods.updateStatusPengiriman(
        numericId,
        arrivedAtDestination
      ).send({
        from: accounts[0],
        gas: Math.floor(Number(gasEstimate) * 1.2)
      });
      
      setSuccess(`Status pengiriman berhasil diperbarui menjadi ${arrivedAtDestination ? 'Sampai Tujuan' : 'Dalam Perjalanan'}`);
      
      // Wait and redirect
      setTimeout(() => {
        router.push('/pengirim/dashboard');
      }, 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Gagal memperbarui status: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Format address with ellipsis
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="confirmation-container">
          <div className="loading">Loading data...</div>
        </div>
      </Layout>
    );
  }

  if (error && !distribution) {
    return (
      <Layout>
        <div className="confirmation-container">
          <div className="error-message">{error}</div>
          <button 
            className="btn-back"
            onClick={() => router.push('/pengirim/dashboard')}
          >
            Kembali ke Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Konfirmasi Pengiriman | Distribusi Kopi</title>
      </Head>
      
      <div className="confirmation-container">
        <div className="page-header">
          <h1>Konfirmasi <span className="gradient-text">Pengiriman</span></h1>
          <p>Update status pengiriman kopi dan konfirmasi penerimaan</p>
          <button 
            className="btn-back"
            onClick={() => router.push('/pengirim/dashboard')}
          >
            &larr; Kembali ke Dashboard
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {distribution && (
          <div className="content-container">
            <div className="distribution-card">
              <div className="card-header">
                <h2>Detail Distribusi #{distribution.id}</h2>
                <span className={`status-badge status-${distribution.status}`}>
                  {distribution.statusText}
                </span>
              </div>
              <div className="card-content">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Lokasi</div>
                    <div className="info-value">{distribution.lokasi}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Berat</div>
                    <div className="info-value">{distribution.beratKg} kg</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Tanggal Panen</div>
                    <div className="info-value">{distribution.tanggalPanen}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Petani</div>
                    <div className="info-value">{formatAddress(distribution.petani)}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Pengepul</div>
                    <div className="info-value">{formatAddress(distribution.pengepul)}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Penerima</div>
                    <div className="info-value">{formatAddress(distribution.penerima)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="confirmation-form-card">
              <div className="card-header">
                <h2>Update Status Pengiriman</h2>
              </div>
              <div className="card-content">
                <form onSubmit={handleUpdateStatus}>
                  <div className="form-group">
                    <label>Status Pengiriman</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          value="sedang_dikirim"
                          checked={shipmentStatus === 'sedang_dikirim'}
                          onChange={() => setShipmentStatus('sedang_dikirim')}
                          disabled={distribution.status === 4}
                        />
                        <span>Sedang Dalam Perjalanan</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          value="sudah_sampai"
                          checked={shipmentStatus === 'sudah_sampai'}
                          onChange={() => setShipmentStatus('sudah_sampai')}
                        />
                        <span>Sudah Sampai di Tujuan</span>
                      </label>
                    </div>
                  </div>

                  {shipmentStatus === 'sudah_sampai' && (
                    <>
                      <div className="form-section">
                        <h3>Detail Penerimaan</h3>
                        <div className="form-group">
                          <label htmlFor="penerimaNama">Nama Penerima <span className="required">*</span></label>
                          <input
                            type="text"
                            id="penerimaNama"
                            value={penerimaNama}
                            onChange={(e) => setPenerimaNama(e.target.value)}
                            placeholder="Masukkan nama penerima"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="penerimaTelp">Nomor Telepon Penerima</label>
                          <input
                            type="text"
                            id="penerimaTelp"
                            value={penerimaTelp}
                            onChange={(e) => setPenerimaTelp(e.target.value)}
                            placeholder="Masukkan nomor telepon penerima"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="tglTerima">Tanggal Diterima <span className="required">*</span></label>
                          <input
                            type="date"
                            id="tglTerima"
                            value={tglTerima}
                            onChange={(e) => setTglTerima(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="buktiTerima">Bukti Penerimaan (Opsional)</label>
                          <input
                            type="file"
                            id="buktiTerima"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file-input"
                          />
                          <div className="file-input-wrapper">
                            <button type="button" className="file-input-button">
                              Pilih File
                            </button>
                            <span className="file-name">
                              {buktiTerima ? buktiTerima.name : 'Belum ada file dipilih'}
                            </span>
                          </div>
                          {previewUrl && (
                            <div className="preview-container">
                              <img src={previewUrl} alt="Preview bukti penerimaan" className="preview-image" />
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="keterangan">Keterangan</label>
                          <textarea
                            id="keterangan"
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            placeholder="Tambahkan keterangan (opsional)"
                            rows="3"
                          ></textarea>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => router.push('/pengirim/dashboard')}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <><span className="loader"></span> Memproses...</>
                      ) : (
                        shipmentStatus === 'sudah_sampai' ? 'Konfirmasi Telah Sampai' : 'Update Status Pengiriman'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .confirmation-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .page-header h1 {
          font-size: 32px;
          margin: 0 0 10px;
          color: #3C2A21;
        }

        .page-header p {
          margin: 0 0 20px;
          color: #666;
        }

        .gradient-text {
          background: linear-gradient(to right, #8B4513, #C8A27A);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .btn-back {
          background: transparent;
          color: #3C2A21;
          border: 1px solid #C8A27A;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-back:hover {
          background: rgba(200, 162, 122, 0.1);
        }

        .error-message {
          background: rgba(244, 67, 54, 0.1);
          color: #f44336;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          border-left: 3px solid #f44336;
        }

        .success-message {
          background: rgba(76, 175, 80, 0.1);
          color: #4caf50;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          border-left: 3px solid #4caf50;
        }

        .content-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .distribution-card, .confirmation-form-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
        }

        .card-header h2 {
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

        .status-3 {
          background: #4169E1;
        }

        .status-4 {
          background: #FF9800;
        }

        .status-5 {
          background: #4CAF50;
        }

        .card-content {
          padding: 20px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .info-item {
          padding: 10px;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .info-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }

        .radio-group {
          display: flex;
          gap: 20px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .form-section {
          background: #f9f9f9;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
        }

        .form-section h3 {
          margin: 0 0 20px;
          font-size: 16px;
          color: #3C2A21;
        }

        input[type="text"],
        input[type="date"],
        textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
        }

        input[type="file"] {
          display: none;
        }

        .file-input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
        }

        .file-input-button {
          background: #4169E1;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .file-name {
          color: #666;
          font-size: 14px;
        }

        .preview-container {
          margin-top: 16px;
        }

        .preview-image {
          max-width: 100%;
          max-height: 200px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .required {
          color: #f44336;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 30px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(90deg, #8B4513, #C8A27A);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(139, 69, 19, 0.2);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-secondary {
          background: transparent;
          color: #333;
          border: 1px solid #ddd;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: #f5f5f5;
        }

        .loader {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
          font-size: 18px;
          color: #666;
        }

        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .radio-group {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default KonfirmasiPengiriman; 