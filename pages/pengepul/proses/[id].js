import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
const distribusi = require('../../../distribusi');
const web3 = require('../../../web3');

const ProsesDistribusi = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isBrowser, setIsBrowser] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [distributionData, setDistributionData] = useState(null);
  const [pengirimAddress, setPengirimAddress] = useState('');
  const [penerimaAddress, setPenerimaAddress] = useState('');
  const [registeredShippers, setRegisteredShippers] = useState([]);
  const [registeredReceivers, setRegisteredReceivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customAddress, setCustomAddress] = useState(false);
  const [customReceiverAddress, setCustomReceiverAddress] = useState(false);

  // Deteksi lingkungan browser
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Cek koneksi dan akses
  useEffect(() => {
    if (!isBrowser) return;
    
    console.log("Router query:", router.query);
    console.log("Router ready:", router.isReady);
    console.log("Distribution ID from router:", id);

    // Only proceed when router is ready and we have an ID
    if (!router.isReady) return;

    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            
            console.log("Connected with wallet:", accounts[0]);
            
            // Cek role user
            const contract = distribusi();
            const role = await contract.methods.roles(accounts[0]).call();
            const roleValue = parseInt(role);
            
            console.log("User role:", roleValue);
            
            // Jika bukan pengepul (role 2), tampilkan error tapi tetap load data
            if (roleValue !== 2) {
              setError('Anda bukan pengepul. Anda hanya dapat melihat data tanpa melakukan validasi.');
              fetchDistributionData(true); // true = view only mode
            } else {
              // Jika pengepul, load data distribusi
              fetchDistributionData(false); // false = not view only mode
              fetchRegisteredShippers();
            }
          } else {
            // Redirect jika tidak terkoneksi
            router.push('/');
          }
        } catch (error) {
          console.error(error);
          setError('Terjadi kesalahan saat memeriksa koneksi');
          setLoading(false);
        }
      } else {
        // Redirect jika MetaMask tidak terinstall
        router.push('/');
      }
    };
    
    checkConnection();
  }, [router.isReady, router.query, isBrowser]);

  // Fungsi untuk mengambil data distribusi
  const fetchDistributionData = async (viewOnly = false) => {
    try {
      setLoading(true);
      setError('');
      
      // Get the ID directly from router.query to ensure we have the latest value
      const currentId = router.query.id;
      
      if (!currentId) {
        console.error('ID is undefined or null in router.query');
        setError('ID distribusi tidak tersedia');
        setLoading(false);
        return;
      }
      
      console.log('Original ID from URL (router.query):', currentId);
      console.log('ID type:', typeof currentId);
      
      const contract = distribusi();
      
      // Convert string ID to numeric ID if needed
      let numericId;
      
      try {
        // If the ID is already a number, use it directly
        if (!isNaN(Number(currentId))) {
          numericId = Number(currentId);
        } 
        // Otherwise, try to parse it as hex if it has 0x prefix
        else if (typeof currentId === 'string' && currentId.startsWith('0x')) {
          numericId = parseInt(currentId, 16);
        } 
        // Fallback to parsing as decimal
        else {
          numericId = parseInt(currentId.toString(), 10);
        }
      } catch (parseError) {
        console.error('Error parsing ID:', parseError);
        numericId = parseInt(currentId);
      }
      
      console.log('Parsed numeric ID:', numericId);
      
      if (isNaN(numericId) || numericId <= 0) {
        setError('ID distribusi tidak valid');
        setLoading(false);
        return;
      }
      
      console.log('Fetching distribution data for ID:', numericId);
      
      try {
        // First check if the ID exists by checking the distribusiCounter
        const counter = await contract.methods.distribusiCounter().call();
        
        console.log('Total distributions:', counter);
        
        if (numericId > Number(counter)) {
          setError(`Distribusi dengan ID ${numericId} tidak ditemukan. Total distribusi: ${counter}`);
          setLoading(false);
          return;
        }
        
        // Ambil data distribusi berdasarkan ID
        console.log('Calling getDistribusi with ID:', numericId);
        const data = await contract.methods.getDistribusi(numericId).call();
        console.log('Distribution data:', data);
        
        // Check if petani address is empty (means distribusi doesn't exist)
        if (data.petani === '0x0000000000000000000000000000000000000000') {
          setError(`Distribusi dengan ID ${numericId} tidak memiliki data yang valid`);
          setLoading(false);
          return;
        }
        
        // Display debugging info
        console.log('Pengepul address in contract:', data.pengepul.toLowerCase());
        console.log('Current wallet address:', walletAddress.toLowerCase());
        console.log('Are addresses the same?', data.pengepul.toLowerCase() === walletAddress.toLowerCase());
        console.log('Current status:', Number(data.status));
        
        // Jika tidak dalam mode view only, periksa alamat pengepul
        if (!viewOnly && data.pengepul.toLowerCase() !== walletAddress.toLowerCase()) {
          setError('Anda bukan pengepul yang ditugaskan untuk distribusi ini');
        }
        
        // Pastikan status distribusi adalah "Dikirim ke Pengepul" (status 1)
        if (Number(data.status) !== 1) {
          setError(`Distribusi ini tidak dalam status yang tepat untuk diproses (status saat ini: ${Number(data.status)})`);
        }
        
        // Format data untuk ditampilkan
        const formattedData = {
          id: numericId,
          petani: data.petani,
          pengepul: data.pengepul,
          lokasi: data.lokasi,
          beratKg: Number(data.berat),
          tanggalPanen: data.tanggalPanen,
          jenisKopi: data.jenisKopi || 'N/A',
          metodePengolahan: data.metodePengolahan || 'N/A',
          waktuDistribusi: new Date().toLocaleString('id-ID'), // Fallback if timestamp not available
          status: Number(data.status)
        };
        
        console.log('Formatted data:', formattedData);
        setDistributionData(formattedData);
      } catch (contractError) {
        console.error('Contract error:', contractError);
        if (contractError.message && contractError.message.includes('revert')) {
          setError(`Transaksi dibatalkan oleh kontrak: ${contractError.message}`);
        } else if (contractError.message && contractError.message.includes('out of gas')) {
          setError('Transaksi kehabisan gas');
        } else {
          setError(`Gagal berkomunikasi dengan kontrak: ${contractError.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Error fetching distribution:', err);
      setError('Gagal memuat data distribusi: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengambil daftar pengirim terdaftar
  const fetchRegisteredShippers = async () => {
    try {
      const contract = distribusi();
      
      // Since there's no event to track role registration, we'll check a list of predefined addresses
      // Ideally in a production system, this would be fetched from a backend service or indexed events
      const testAddresses = [
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
        '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
        '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
        '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
        '0xcd3B766CCDd6AE721141F452C550Ca635964ce71',
        '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
        '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E'
      ];
      
      const pengirimAddresses = [];
      
      // Check each address to see if it has role 3 (Pengirim)
      for (const address of testAddresses) {
        try {
          const role = await contract.methods.roles(address).call();
          if (Number(role) === 3) {
            let name = `Pengirim (${formatAddress(address)})`;
            
            // Try to get user name if contract has it (optional)
            try {
              // Attempt to get a username - you can customize this based on your contract
              const userName = await contract.methods.userNames(address).call().catch(() => '');
              if (userName && userName !== '') {
                name = `${userName} (${formatAddress(address)})`;
              }
            } catch (nameErr) {
              console.log('No userNames method found or error:', nameErr);
            }
            
            pengirimAddresses.push({ address, name });
          }
        } catch (err) {
          console.log(`Error checking role for ${address}:`, err);
        }
      }
      
      console.log('Found registered pengirim addresses:', pengirimAddresses);
      
      // If no pengirim found, use default examples for testing
      if (pengirimAddresses.length === 0) {
        setRegisteredShippers([
          { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Expedisi Kopi Prima' },
          { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'JNE Cargo' },
          { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Ninja Express' }
        ]);
      } else {
        setRegisteredShippers(pengirimAddresses);
      }
    } catch (err) {
      console.error('Error fetching shippers:', err);
      // Fallback to example data
      setRegisteredShippers([
        { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Expedisi Kopi Prima' },
        { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'JNE Cargo' },
        { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Ninja Express' }
      ]);
    }
  };

  // Fungsi untuk mengambil daftar penerima terdaftar
  const fetchRegisteredReceivers = async () => {
    try {
      const contract = distribusi();
      
      // Since there's no event to track role registration, we'll check a list of predefined addresses
      // Ideally in a production system, this would be fetched from a backend service or indexed events
      const testAddresses = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
        '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
        '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
        '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
        '0xcd3B766CCDd6AE721141F452C550Ca635964ce71',
        '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
        '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E'
      ];
      
      const penerimaAddresses = [];
      
      // Check each address to see if it has role 4 (Penerima)
      for (const address of testAddresses) {
        try {
          const role = await contract.methods.roles(address).call();
          if (Number(role) === 4) {
            let name = `Penerima (${formatAddress(address)})`;
            
            // Try to get user name if contract has it (optional)
            try {
              // Attempt to get a username - you can customize this based on your contract
              const userName = await contract.methods.userNames(address).call().catch(() => '');
              if (userName && userName !== '') {
                name = `${userName} (${formatAddress(address)})`;
              }
            } catch (nameErr) {
              console.log('No userNames method found or error:', nameErr);
            }
            
            penerimaAddresses.push({ address, name });
          }
        } catch (err) {
          console.log(`Error checking role for ${address}:`, err);
        }
      }
      
      console.log('Found registered penerima addresses:', penerimaAddresses);
      
      // If no penerima found, use default examples for testing
      if (penerimaAddresses.length === 0) {
        setRegisteredReceivers([
          { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Kopi Roastery Jakarta' },
          { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Café Bandung' },
          { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Coffee Shop Surabaya' }
        ]);
      } else {
        setRegisteredReceivers(penerimaAddresses);
      }
    } catch (err) {
      console.error('Error fetching receivers:', err);
      // Fallback to example data
      setRegisteredReceivers([
        { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Kopi Roastery Jakarta' },
        { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Café Bandung' },
        { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Coffee Shop Surabaya' }
      ]);
    }
  };

  // Panggil fungsi untuk mendapatkan daftar penerima
  useEffect(() => {
    if (isConnected) {
      fetchRegisteredReceivers();
    }
  }, [isConnected]);

  // Fungsi untuk memproses distribusi
  const handleProsesDistribusi = async (e) => {
    e.preventDefault();
    
    if (!pengirimAddress || !pengirimAddress.trim()) {
      setError('Silakan pilih atau masukkan alamat pengirim');
      return;
    }

    if (!penerimaAddress || !penerimaAddress.trim()) {
      setError('Silakan pilih atau masukkan alamat penerima');
      return;
    }
    
    try {
      setSubmitLoading(true);
      setError('');
      setSuccess('');
      
      // Validasi alamat ethereum pengirim
      if (!web3.utils.isAddress(pengirimAddress)) {
        setError('Alamat pengirim tidak valid');
        setSubmitLoading(false);
        return;
      }

      // Validasi alamat ethereum penerima
      if (!web3.utils.isAddress(penerimaAddress)) {
        setError('Alamat penerima tidak valid');
        setSubmitLoading(false);
        return;
      }
      
      // Ensure we have a valid numeric ID
      const numericId = parseInt(id.toString().replace(/^0x/, ''), 16) || parseInt(id);
      if (isNaN(numericId)) {
        setError('ID distribusi tidak valid');
        setSubmitLoading(false);
        return;
      }
      
      console.log('Processing distribution ID:', numericId, 'Pengirim:', pengirimAddress, 'Penerima:', penerimaAddress);
      
      // Referensi ke kontrak
      const contract = distribusi();
      const accounts = await web3.eth.getAccounts();
      
      try {
        // 1. Set Penerima terlebih dahulu
        console.log('Setting penerima address to:', penerimaAddress);
        let gasEstimatePenerima = await contract.methods.setDistribusiPenerima(
          numericId,
          penerimaAddress
        ).estimateGas({ from: accounts[0] });
        
        console.log('Gas estimate for setDistribusiPenerima:', gasEstimatePenerima);
        
        const receiptPenerima = await contract.methods.setDistribusiPenerima(
          numericId,
          penerimaAddress
        ).send({ 
          from: accounts[0],
          gas: Math.floor(Number(gasEstimatePenerima) * 1.2)
        });
        
        console.log('Penerima set transaction receipt:', receiptPenerima);
        
        // 2. Kemudian validasi pengepul dengan pengirim
        console.log('Validating with pengirim address:', pengirimAddress);
        let gasEstimatePengirim = await contract.methods.validasiPengepul(
          numericId,
          pengirimAddress
        ).estimateGas({ from: accounts[0] });
        
        console.log('Gas estimate for validasiPengepul:', gasEstimatePengirim);
        
        const receiptPengirim = await contract.methods.validasiPengepul(
          numericId,
          pengirimAddress
        ).send({ 
          from: accounts[0],
          gas: Math.floor(Number(gasEstimatePengirim) * 1.2)
        });
        
        console.log('validasiPengepul transaction receipt:', receiptPengirim);
        
        setSuccess('Distribusi berhasil diproses! Pengirim dan penerima telah ditentukan.');
        
        // Redirect ke dashboard pengepul setelah berhasil
        setTimeout(() => {
          router.push('/pengepul/dashboard');
        }, 3000);
      } catch (estimateError) {
        console.error('Error during transaction:', estimateError);
        
        // Check specific error messages
        if (estimateError.message.includes('Bukan pengepul yang sah')) {
          setError('Anda bukan pengepul yang ditugaskan untuk distribusi ini');
        } else if (estimateError.message.includes('Alamat bukan penerima terdaftar')) {
          setError('Alamat penerima tidak terdaftar dengan role Penerima (4)');
        } else {
          setError('Gagal memproses distribusi: ' + estimateError.message);
        }
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses distribusi');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Format alamat wallet
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Render
  return (
    <div className="proses-page">
      <Head>
        <title>Proses Distribusi | Pengepul Dashboard</title>
        <meta name="description" content="Proses distribusi kopi dan pilih pengirim" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Header />

      {isBrowser && (
        <main>
          <div className="container">
            <div className="page-header">
              <div>
                <h1>Proses <span className="gradient-text">Distribusi</span></h1>
                <p>Validasi penerimaan kopi dan pilih pengirim</p>
              </div>
              <button 
                className="btn-back"
                onClick={() => router.push('/pengepul/dashboard')}
              >
                &larr; Kembali
              </button>
            </div>

            <div className="wallet-info">
              <div className="wallet-badge">
                <div className="dot"></div>
                <span>Terhubung dengan: {isConnected ? formatAddress(walletAddress) : 'Tidak terkoneksi'}</span>
              </div>
              <div>ID: {router.query.id}</div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {loading ? (
              <div className="loading-container">
                <div className="loader"></div>
                <p>Memuat data distribusi...</p>
              </div>
            ) : error && !distributionData ? (
              <div className="empty-state">
                <div className="empty-icon">⚠️</div>
                <h3>{error.includes('tidak ditemukan') ? 'Data Tidak Ditemukan' : 'Error'}</h3>
                <p>{error}</p>
                <p className="debug-info">ID dari URL: {router.query.id}</p>
                <button 
                  className="btn-primary"
                  onClick={() => router.push('/pengepul/dashboard')}
                >
                  Kembali ke Dashboard
                </button>
              </div>
            ) : distributionData ? (
              <div className="content-container">
                <div className="distribution-card">
                  <div className="card-header">
                    <h2>Detail Distribusi #{distributionData.id}</h2>
                  </div>
                  <div className="card-content">
                    {error && <div className="error-message">{error}</div>}
                    <div className="info-grid">
                      <div className="info-item">
                        <div className="info-label">Jenis Kopi</div>
                        <div className="info-value">{distributionData.jenisKopi}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Berat</div>
                        <div className="info-value">{distributionData.beratKg} kg</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Tanggal Panen</div>
                        <div className="info-value">{distributionData.tanggalPanen}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Lokasi</div>
                        <div className="info-value">{distributionData.lokasi}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Metode Pengolahan</div>
                        <div className="info-value">{distributionData.metodePengolahan}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Petani</div>
                        <div className="info-value">{formatAddress(distributionData.petani)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hanya tampilkan form jika tidak ada error atau user adalah pengepul yang sah */}
                {!error && distributionData.pengepul.toLowerCase() === walletAddress.toLowerCase() && distributionData.status === 1 && (
                  <div className="process-form-card">
                    <div className="card-header">
                      <h2>Pilih Pengirim dan Penerima</h2>
                    </div>
                    <div className="card-content">
                      <form onSubmit={handleProsesDistribusi}>
                        {/* Bagian Pengirim */}
                        <h3 className="section-title">Data Pengirim</h3>
                        <div className="form-group">
                          <label>Pilih Jenis Pengirim</label>
                          <div className="toggle-switch">
                            <div 
                              className={`toggle-option ${!customAddress ? 'active' : ''}`}
                              onClick={() => setCustomAddress(false)}
                            >
                              Pengirim Terdaftar
                            </div>
                            <div 
                              className={`toggle-option ${customAddress ? 'active' : ''}`}
                              onClick={() => setCustomAddress(true)}
                            >
                              Alamat Kustom
                            </div>
                          </div>
                        </div>
                        
                        {!customAddress ? (
                          <div className="form-group">
                            <label htmlFor="pengirimSelect">Pilih Pengirim</label>
                            <select 
                              id="pengirimSelect"
                              value={pengirimAddress}
                              onChange={(e) => setPengirimAddress(e.target.value)}
                              required
                            >
                              <option value="">-- Pilih Pengirim --</option>
                              {registeredShippers.map((shipper, index) => (
                                <option key={index} value={shipper.address}>
                                  {shipper.name}
                                </option>
                              ))}
                            </select>
                            <small className="help-text">Pilih pengirim dari daftar pengirim terdaftar</small>
                          </div>
                        ) : (
                          <div className="form-group">
                            <label htmlFor="customAddressInput">Alamat Wallet Pengirim</label>
                            <input
                              id="customAddressInput"
                              type="text"
                              value={pengirimAddress}
                              onChange={(e) => setPengirimAddress(e.target.value)}
                              placeholder="0x..."
                              required
                            />
                            <small className="help-text">Masukkan alamat wallet pengirim yang valid (format 0x...)</small>
                          </div>
                        )}
                        
                        {/* Bagian Penerima */}
                        <h3 className="section-title">Data Penerima</h3>
                        <div className="form-group">
                          <label>Pilih Jenis Penerima</label>
                          <div className="toggle-switch">
                            <div 
                              className={`toggle-option ${!customReceiverAddress ? 'active' : ''}`}
                              onClick={() => setCustomReceiverAddress(false)}
                            >
                              Penerima Terdaftar
                            </div>
                            <div 
                              className={`toggle-option ${customReceiverAddress ? 'active' : ''}`}
                              onClick={() => setCustomReceiverAddress(true)}
                            >
                              Alamat Kustom
                            </div>
                          </div>
                        </div>
                        
                        {!customReceiverAddress ? (
                          <div className="form-group">
                            <label htmlFor="penerimaSelect">Pilih Penerima</label>
                            <select 
                              id="penerimaSelect"
                              value={penerimaAddress}
                              onChange={(e) => setPenerimaAddress(e.target.value)}
                              required
                            >
                              <option value="">-- Pilih Penerima --</option>
                              {registeredReceivers.map((receiver, index) => (
                                <option key={index} value={receiver.address}>
                                  {receiver.name}
                                </option>
                              ))}
                            </select>
                            <small className="help-text">Pilih penerima dari daftar penerima terdaftar</small>
                          </div>
                        ) : (
                          <div className="form-group">
                            <label htmlFor="customReceiverAddressInput">Alamat Wallet Penerima</label>
                            <input
                              id="customReceiverAddressInput"
                              type="text"
                              value={penerimaAddress}
                              onChange={(e) => setPenerimaAddress(e.target.value)}
                              placeholder="0x..."
                              required
                            />
                            <small className="help-text">Masukkan alamat wallet penerima yang valid (format 0x...)</small>
                          </div>
                        )}

                        <div className="info-message">
                          <b>Penting:</b> Alamat penerima yang dipilih harus sudah terdaftar sebagai Penerima (role 4) di smart contract. 
                          Jika tidak, transaksi akan gagal dengan pesan "Alamat bukan penerima terdaftar".
                        </div>
                        
                        <div className="form-actions">
                          <button 
                            type="button" 
                            className="btn-secondary"
                            onClick={() => router.push('/pengepul/dashboard')}
                          >
                            Batal
                          </button>
                          <button 
                            type="submit" 
                            className="btn-primary"
                            disabled={submitLoading}
                          >
                            {submitLoading ? (
                              <><div className="loader-small"></div> Memproses...</>
                            ) : (
                              'Proses Distribusi'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <div className="action-buttons">
                  <button 
                    className="btn-back"
                    onClick={() => router.push('/pengepul/dashboard')}
                  >
                    Kembali ke Dashboard
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => router.push('/tracking?id=' + distributionData.id)}
                  >
                    Lihat Pelacakan
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⚠️</div>
                <h3>Data Tidak Ditemukan</h3>
                <p>Tidak dapat memuat data distribusi atau distribusi tidak ada</p>
                <button 
                  className="btn-primary"
                  onClick={() => router.push('/pengepul/dashboard')}
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      <style jsx>{`
        .proses-page {
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

        .btn-back {
          background: transparent;
          color: white;
          border: 1px solid rgba(224, 187, 145, 0.5);
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-back:hover {
          background: rgba(224, 187, 145, 0.1);
        }

        .wallet-info {
          margin-bottom: 24px;
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

        .content-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .distribution-card, .process-form-card {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(224, 187, 145, 0.2);
        }

        .card-header {
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(224, 187, 145, 0.1);
        }

        .card-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
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
          background: rgba(0, 0, 0, 0.1);
          padding: 12px;
          border-radius: 8px;
        }

        .info-label {
          font-size: 12px;
          color: #C8A27A;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        select, input {
          width: 100%;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(224, 187, 145, 0.3);
          border-radius: 4px;
          color: white;
          font-family: 'Poppins', sans-serif;
        }

        select:focus, input:focus {
          outline: none;
          border-color: #C8A27A;
        }

        .help-text {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          opacity: 0.7;
        }

        .toggle-switch {
          display: flex;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(224, 187, 145, 0.3);
          margin-bottom: 16px;
        }

        .toggle-option {
          flex: 1;
          text-align: center;
          padding: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-option.active {
          background: rgba(200, 162, 122, 0.3);
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 30px;
        }

        .btn-primary {
          display: flex;
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
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(224, 187, 145, 0.1);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
        }

        .loader {
          border: 4px solid rgba(200, 162, 122, 0.2);
          border-top: 4px solid #C8A27A;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .loader-small {
          border: 2px solid rgba(255, 255, 255, 0.2);
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

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          border: 1px solid rgba(224, 187, 145, 0.2);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px;
          font-weight: 600;
        }

        .empty-state p {
          opacity: 0.7;
          margin: 0 0 20px;
        }
        
        .debug-info {
          font-family: monospace;
          background: rgba(0, 0, 0, 0.2);
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 20px;
          border-left: 3px solid #FFC107;
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

        .action-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
          gap: 12px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 500;
          color: #C8A27A;
          margin: 24px 0 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(200, 162, 122, 0.3);
        }

        .info-message {
          background: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 4px;
          margin-top: 16px;
          margin-bottom: 20px;
          border: 1px solid rgba(224, 187, 145, 0.2);
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .info-grid {
            grid-template-columns: 1fr 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }
        }

        @media (max-width: 500px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ProsesDistribusi; 