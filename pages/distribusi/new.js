import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
const distribusi = require('../../distribusi');
const web3 = require('../../web3');

const NewDistribution = () => {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [formData, setFormData] = useState({
    farmName: '',
    location: '',
    harvestDate: '',
    coffeeType: '',
    processingMethod: '',
    batchWeight: '',
    price: '',
    additionalInfo: '',
    collectorAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredCollectors, setRegisteredCollectors] = useState([]);
  const [fetchingCollectors, setFetchingCollectors] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            
            // Check if user has a registered role and is a Petani (role 1)
            const contract = distribusi();
            const role = await contract.methods.roles(accounts[0]).call();
            
            // If no role is registered, redirect to register page
            if (parseInt(role) === 0) {
              router.push('/register');
            } else if (parseInt(role) !== 1) {
              // If not a Petani (role 1), redirect to distribusi page
              // Only Petani can add new distribution
              router.push('/distribusi');
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
  }, [router]);

  useEffect(() => {
    const fetchRegisteredCollectors = async () => {
      if (isConnected) {
        try {
          setFetchingCollectors(true);
          setError('');
          
          const contract = distribusi();
          const web3Instance = web3;
          
          // Debug information - log current address and role
          try {
            const currentRole = await contract.methods.roles(walletAddress).call();
            console.log(`Current wallet: ${walletAddress}, Role: ${currentRole}`);
          } catch (err) {
            console.error("Error checking current role:", err);
          }
          
          // Also add metamask accounts from window.ethereum
          let metamaskAccounts = [];
          try {
            if (window.ethereum && window.ethereum.request) {
              metamaskAccounts = await window.ethereum.request({ 
                method: 'eth_accounts' 
              });
            }
          } catch (err) {
            console.error("Error getting metamask accounts:", err);
          }
          
          // Get all known accounts, removing duplicates
          const allPossibleAccounts = [...new Set([
            ...metamaskAccounts
          ])];
          
          // Check each address for role 2 (Pengepul)
          const verifiedCollectors = [];
          
          console.log("Checking these addresses for role 2 (Pengepul):", allPossibleAccounts);
          
          for (const address of allPossibleAccounts) {
            try {
              const role = await contract.methods.roles(address).call();
              console.log(`Address: ${address}, Role: ${role}`);
              if (parseInt(role) === 2) { // Role 2 is Pengepul
                verifiedCollectors.push(address);
              }
            } catch (err) {
              console.error(`Error checking role for ${address}:`, err);
            }
          }
          
          // Final debug info
          console.log("Found these collectors with role 2:", verifiedCollectors);
          
          setRegisteredCollectors(verifiedCollectors);
          
          if (verifiedCollectors.length === 0) {
            setError('Tidak ada pengepul yang terdaftar. Harap daftarkan alamat dengan role 2 (Pengepul) terlebih dahulu.');
          }
        } catch (error) {
          console.error('Error fetching collectors:', error);
          setError('Gagal memuat daftar pengepul dari blockchain');
        } finally {
          setFetchingCollectors(false);
        }
      }
    };
    
    if (isConnected) {
      fetchRegisteredCollectors();
    }
  }, [isConnected, walletAddress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validasi data
      if (!formData.location || !formData.batchWeight || !formData.harvestDate || !formData.collectorAddress) {
        setError('Semua field wajib diisi!');
        return;
      }

      // Format data yang akan dikirim ke smart contract
      const beratInKg = parseInt(formData.batchWeight);
      const pengepulAddress = formData.collectorAddress;
      
      // Mendapatkan referensi kontrak
      const contract = distribusi();
      const accounts = await web3.eth.getAccounts();
      
      // Log data untuk debugging
      console.log("Data distribusi yang akan dikirim:", {
        lokasi: formData.location,
        berat: beratInKg,
        tanggalPanen: formData.harvestDate,
        pengepul: pengepulAddress,
        jenisKopi: formData.coffeeType || "N/A",
        metodePengolahan: formData.processingMethod || "N/A"
      });
      
      // Get gas estimate first to optimize gas usage
      const gasEstimate = await contract.methods.tambahDistribusi(
        formData.location,
        beratInKg,
        formData.harvestDate,
        pengepulAddress
      ).estimateGas({ from: accounts[0] });
      
      // Get current gas price
      const gasPrice = await web3.eth.getGasPrice();
      // Use 90% of current gas price to reduce costs but ensure transaction doesn't get stuck
      const adjustedGasPrice = Math.floor(Number(gasPrice) * 0.9).toString();
      
      // Send transaction to the blockchain with optimized gas settings
      await contract.methods.tambahDistribusi(
        formData.location,
        beratInKg,
        formData.harvestDate,
        pengepulAddress
      ).send({ 
        from: accounts[0],
        gas: Math.floor(Number(gasEstimate) * 1.2), // Add 20% buffer to gas estimate
        gasPrice: adjustedGasPrice // Use reduced gas price
      });
      
      setSuccess(true);
      // Redirect to a success page or list after 3 seconds
      setTimeout(() => {
        router.push('/distribusi');
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat membuat distribusi baru');
    } finally {
      setLoading(false);
    }
  };

  // Add this new function for checking roles
  const checkRegisteredRoles = async () => {
    try {
      setDebugInfo([{ address: 'Mencari roles...', role: 'Loading' }]);
      setShowDebugInfo(true);
      
      const contract = distribusi();
      
      // List of addresses to check
      const testAddresses = [
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
      ];
      
      const roleInfo = [];
      
      for (const address of testAddresses) {
        try {
          const role = await contract.methods.roles(address).call();
          const roleNumber = parseInt(role);
          let roleName = 'Unknown';
          
          switch(roleNumber) {
            case 0: roleName = 'None'; break;
            case 1: roleName = 'Petani'; break;
            case 2: roleName = 'Pengepul'; break;
            case 3: roleName = 'Pengirim'; break;
            case 4: roleName = 'Penerima'; break;
            default: roleName = 'Unknown';
          }
          
          roleInfo.push({
            address: address,
            role: `${roleNumber} (${roleName})`
          });
        } catch (err) {
          roleInfo.push({
            address: address,
            role: 'Error'
          });
        }
      }
      
      // Also add the current wallet address
      try {
        const role = await contract.methods.roles(walletAddress).call();
        const roleNumber = parseInt(role);
        let roleName = 'Unknown';
        
        switch(roleNumber) {
          case 0: roleName = 'None'; break;
          case 1: roleName = 'Petani'; break;
          case 2: roleName = 'Pengepul'; break;
          case 3: roleName = 'Pengirim'; break;
          case 4: roleName = 'Penerima'; break;
          default: roleName = 'Unknown';
        }
        
        roleInfo.push({
          address: walletAddress,
          role: `${roleNumber} (${roleName}) - Current address`
        });
      } catch (err) {
        roleInfo.push({
          address: walletAddress,
          role: 'Error'
        });
      }
      
      setDebugInfo(roleInfo);
    } catch (error) {
      console.error('Error checking roles:', error);
      setDebugInfo([{ address: 'Error', role: error.message }]);
    }
  };

  return (
    <div className="distribution-page">
      <Head>
        <title>Tambah Distribusi Baru | Sistem Distribusi Kopi</title>
        <meta name="description" content="Tambahkan distribusi kopi baru ke blockchain" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Header />

      <main>
        <div className="container">
          <div className="form-container">
            <div className="form-header">
              <h1>Tambah Distribusi Kopi <span className="gradient-text">Baru</span></h1>
              <p>Masukkan detail distribusi kopi baru ke blockchain untuk pelacakan transparan</p>
            </div>

            {success ? (
              <div className="success-message">
                <div className="success-icon">✓</div>
                <h2>Distribusi Berhasil Ditambahkan!</h2>
                <p>Data distribusi kopi anda telah berhasil dicatat di blockchain.</p>
                <p>Mengalihkan ke halaman distribusi...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="distribution-form">
                <div className="wallet-info">
                  <div className="wallet-badge">
                    <div className="dot"></div>
                    <span>Terhubung dengan: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="farmName">Nama Perkebunan</label>
                    <input
                      type="text"
                      id="farmName"
                      name="farmName"
                      value={formData.farmName}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: Perkebunan Kopi Makmur"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Lokasi</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: Bandung, Jawa Barat"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="harvestDate">Tanggal Panen</label>
                    <input
                      type="date"
                      id="harvestDate"
                      name="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="coffeeType">Jenis Kopi</label>
                    <select
                      id="coffeeType"
                      name="coffeeType"
                      value={formData.coffeeType}
                      onChange={handleChange}
                    >
                      <option value="">Pilih jenis kopi</option>
                      <option value="Arabika">Arabika</option>
                      <option value="Robusta">Robusta</option>
                      <option value="Liberika">Liberika</option>
                      <option value="Excelsa">Excelsa</option>
                      <option value="Luwak">Kopi Luwak</option>
                      <option value="Lanang">Kopi Lanang</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="processingMethod">Metode Pengolahan</label>
                    <select
                      id="processingMethod"
                      name="processingMethod"
                      value={formData.processingMethod}
                      onChange={handleChange}
                    >
                      <option value="">Pilih metode pengolahan</option>
                      <option value="Natural Process">Natural Process</option>
                      <option value="Washed Process">Washed Process</option>
                      <option value="Honey Process">Honey Process</option>
                      <option value="Wet-Hulled">Wet-Hulled (Giling Basah)</option>
                      <option value="Semi-Washed">Semi-Washed</option>
                      <option value="Pulped Natural">Pulped Natural</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="batchWeight">Berat Batch (kg)</label>
                    <input
                      type="number"
                      id="batchWeight"
                      name="batchWeight"
                      value={formData.batchWeight}
                      onChange={handleChange}
                      required
                      min="1"
                      placeholder="Contoh: 100"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Harga per Kg (Rp)</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="1000"
                      placeholder="Contoh: 150000"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="additionalInfo">Informasi Tambahan</label>
                    <textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Masukkan detail tambahan tentang kopi (aroma, ketinggian penanaman, dll)"
                    ></textarea>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="collectorAddress">Pilih Pengepul (Role 2)</label>
                    {fetchingCollectors ? (
                      <div className="loading-select">Memuat daftar pengepul...</div>
                    ) : registeredCollectors.length > 0 ? (
                      <>
                        <select
                          id="collectorAddress"
                          name="collectorAddress"
                          value={formData.collectorAddress}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Pilih pengepul terdaftar</option>
                          {registeredCollectors.map((collector, index) => (
                            <option key={index} value={collector}>
                              {`${collector.substring(0, 6)}...${collector.substring(collector.length - 4)}`}
                            </option>
                          ))}
                        </select>
                        <small className="input-info">
                          {registeredCollectors.length} alamat Pengepul (Role 2) ditemukan
                        </small>
                      </>
                    ) : (
                      <div className="no-collectors-message">
                        Tidak ada pengepul yang terdaftar. Silakan daftarkan alamat sebagai pengepul terlebih dahulu.
                      </div>
                    )}
                    <button 
                      type="button" 
                      className="btn-refresh"
                      onClick={() => {
                        setFetchingCollectors(true);
                        setTimeout(() => {
                          const fetchCollectors = async () => {
                            try {
                              const contract = distribusi();
                              
                              // Get all accounts from MetaMask
                              const allAccounts = await window.ethereum.request({ 
                                method: 'eth_accounts' 
                              });
                              
                              // Check each account for role
                              const collectors = [];
                              for (const account of allAccounts) {
                                try {
                                  const role = await contract.methods.roles(account).call();
                                  if (parseInt(role) === 2) {
                                    collectors.push(account);
                                  }
                                } catch (err) {
                                  console.error(`Error checking role for ${account}:`, err);
                                }
                              }
                              
                              setRegisteredCollectors(collectors);
                              
                              if (collectors.length === 0) {
                                setError('Tidak ada pengepul yang terdaftar di akun MetaMask Anda.');
                              } else {
                                setError('');
                              }
                            } catch (err) {
                              console.error("Error refreshing collectors:", err);
                              setError('Gagal memperbarui daftar pengepul');
                            } finally {
                              setFetchingCollectors(false);
                            }
                          };
                          
                          fetchCollectors();
                        }, 500);
                      }}
                    >
                      ↻ Perbarui Daftar
                    </button>
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => router.push('/')}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="loader"></span> Memproses...</>
                    ) : (
                      'Tambah Distribusi'
                    )}
                  </button>
                </div>
                
                <div className="debug-section">
                  <button 
                    type="button"
                    className="btn-debug"
                    onClick={checkRegisteredRoles}
                  >
                    Periksa Pengepul Terdaftar
                  </button>
                  
                  {showDebugInfo && (
                    <div className="debug-info">
                      <h3>Role Information:</h3>
                      <table className="role-table">
                        <thead>
                          <tr>
                            <th>Address</th>
                            <th>Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debugInfo.map((info, index) => (
                            <tr key={index}>
                              <td>{info.address}</td>
                              <td>{info.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .distribution-page {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(to bottom, #1A120B, #3C2A21);
          color: white;
          min-height: 100vh;
        }

        main {
          padding: 120px 20px 60px;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .form-container {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 40px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(224, 187, 145, 0.2);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .form-header {
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

        .form-header p {
          opacity: 0.8;
          max-width: 600px;
          margin: 0 auto;
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

        .distribution-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .full-width {
          width: 100%;
        }

        label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #E5B168;
        }

        input, select, textarea {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(224, 187, 145, 0.3);
          border-radius: 4px;
          padding: 12px 16px;
          color: white;
          font-family: 'Poppins', sans-serif;
          transition: border-color 0.2s;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #C8A27A;
          box-shadow: 0 0 0 2px rgba(200, 162, 122, 0.3);
        }

        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23E5B168' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          padding-right: 40px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          margin-top: 10px;
        }

        button {
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 500;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(90deg, #8B4513 0%, #C8A27A 100%);
          color: white;
          border: none;
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

        .btn-secondary {
          background: transparent;
          color: white;
          border: 1px solid rgba(224, 187, 145, 0.5);
        }

        .btn-secondary:hover {
          background: rgba(224, 187, 145, 0.1);
        }

        .error-message {
          color: #ff4d4d;
          background: rgba(255, 77, 77, 0.1);
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .success-message {
          text-align: center;
          padding: 30px;
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

        .success-message h2 {
          font-size: 24px;
          margin-bottom: 10px;
        }

        .success-message p {
          opacity: 0.8;
          margin: 5px 0;
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
          .form-row {
            flex-direction: column;
            gap: 16px;
          }
          
          .form-container {
            padding: 30px 20px;
          }
          
          h1 {
            font-size: 26px;
          }
        }

        .input-info {
          display: block;
          margin-top: 5px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
        }

        .loading-select {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(224, 187, 145, 0.3);
          border-radius: 4px;
          padding: 12px 16px;
          color: white;
          font-family: 'Poppins', sans-serif;
          transition: border-color 0.2s;
        }

        .no-collectors-message {
          background: rgba(255, 77, 77, 0.1);
          border: 1px solid rgba(255, 77, 77, 0.3);
          border-radius: 4px;
          padding: 12px 16px;
          color: #ff4d4d;
          font-family: 'Poppins', sans-serif;
          margin-bottom: 10px;
        }

        .debug-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px dashed rgba(255, 255, 255, 0.2);
        }
        
        .btn-debug {
          background: transparent;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.6);
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .btn-debug:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .debug-info {
          margin-top: 15px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        
        .debug-info h3 {
          margin-top: 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
        }
        
        .role-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .role-table th, .role-table td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .role-table th {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }
        
        .role-table td {
          color: rgba(255, 255, 255, 0.9);
          font-family: monospace;
        }

        .btn-refresh {
          background: transparent;
          border: 1px solid rgba(224, 187, 145, 0.5);
          color: rgba(224, 187, 145, 0.8);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.3s ease;
        }
        
        .btn-refresh:hover {
          background: rgba(224, 187, 145, 0.1);
          color: rgba(224, 187, 145, 1);
        }
      `}</style>
    </div>
  );
};

export default NewDistribution; 