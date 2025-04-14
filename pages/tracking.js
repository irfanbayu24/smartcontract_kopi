import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Web3 from 'web3';
import DistribusiKopi from '../artifacts/contracts/DistribusiKopi.sol/DistribusiKopi.json';

const Tracking = () => {
  const router = useRouter();
  const [isBrowser, setIsBrowser] = useState(false);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [coffeeData, setCoffeeData] = useState(null);
  const [steps, setSteps] = useState([]);
  const [participants, setParticipants] = useState([]);

  // Deteksi lingkungan browser pada client-side
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Inisialisasi web3 dan kontrak
  useEffect(() => {
    // Hanya jalankan di browser
    if (!isBrowser) return;

    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          
          const contractAddress = '0x7595da24C3865365F2e435A9dE8f7d9521Ad4340';
          const contractInstance = new web3Instance.eth.Contract(
            DistribusiKopi.abi,
            contractAddress
          );
          setContract(contractInstance);
        } catch (error) {
          console.error("Error initializing web3:", error);
          setError("Gagal menghubungkan ke blockchain. Silakan periksa koneksi MetaMask Anda.");
        }
      } else {
        setError("MetaMask tidak terdeteksi. Silakan instal ekstensi MetaMask untuk menggunakan fitur ini.");
      }
    };

    initWeb3();
  }, [isBrowser]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!trackingId || !trackingId.trim()) {
      setError("Harap masukkan ID pelacakan");
      return;
    }
    
    if (!contract) {
      setError("Kontrak blockchain belum terinisialisasi. Silakan coba lagi.");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setCoffeeData(null);
      
      // Konversi ID dari string ke number jika perlu
      const id = parseInt(trackingId);
      
      // Panggil fungsi getDistribution dari smart contract
      const distribution = await contract.methods.getDistribution(id).call();
      
      if (!distribution || !distribution.batchName) {
        setError("Data distribusi tidak ditemukan. Periksa ID pelacakan Anda.");
        setLoading(false);
        return;
      }
      
      // Format data untuk ditampilkan
      const formattedData = {
        id: id,
        batchName: distribution.batchName,
        batchWeight: Number(distribution.batchWeight) / 100,
        farmLocation: distribution.farmLocation,
        harvestDate: new Date(Number(distribution.harvestDate) * 1000).toLocaleDateString('id-ID'),
        processingMethod: getProcessingMethod(Number(distribution.processingMethod)),
        petaniAddress: distribution.petani,
        status: getStatusName(Number(distribution.status)),
        pengepulAddress: distribution.pengepul || 'Belum ada',
        pengolahAddress: distribution.pengolahAkhir || 'Belum ada',
        coffeeType: getCoffeeType(Number(distribution.coffeeType)),
        createdAt: new Date(Number(distribution.createdAt) * 1000).toLocaleDateString('id-ID')
      };
      
      // Set data kopi yang ditemukan
      setCoffeeData(formattedData);
      
      // Generate langkah-langkah pelacakan berdasarkan status
      generateTrackingSteps(formattedData, Number(distribution.status));
      
      setLoading(false);
    } catch (error) {
      console.error("Error searching distribution:", error);
      setError("Terjadi kesalahan saat mengambil data. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const getProcessingMethod = (method) => {
    const methods = ["Natural", "Washed", "Honey", "Wet Hulled"];
    return methods[method] || "Unknown";
  };
  
  const getCoffeeType = (type) => {
    const types = ["Arabica", "Robusta", "Liberica", "Excelsa"];
    return types[type] || "Unknown";
  };
  
  const getStatusName = (status) => {
    const statusNames = [
      "Belum divalidasi",
      "Sedang diproses Petani",
      "Dalam pengiriman ke Pengepul",
      "Divalidasi Pengepul",
      "Dalam pengiriman ke Pengolah",
      "Selesai diproses"
    ];
    return statusNames[status] || "Unknown";
  };
  
  const generateTrackingSteps = (data, status) => {
    const trackingSteps = [
      {
        id: 1,
        title: "Panen",
        description: `Kopi dipanen oleh Petani di ${data.farmLocation}`,
        date: data.harvestDate,
        icon: "🌱",
        completed: status >= 0
      },
      {
        id: 2,
        title: "Dicatat dalam Blockchain",
        description: `Batch ${data.batchName} dicatat dalam blockchain oleh Petani`,
        date: data.createdAt,
        icon: "📝",
        completed: status >= 1
      },
      {
        id: 3,
        title: "Pengiriman ke Pengepul",
        description: `Kopi ${data.coffeeType} seberat ${data.batchWeight} kg dikirim ke Pengepul`,
        date: status >= 2 ? "Dalam proses" : "Menunggu",
        icon: "🚚",
        completed: status >= 2
      },
      {
        id: 4,
        title: "Validasi Pengepul",
        description: "Pengepul memvalidasi penerimaan dan kualitas kopi",
        date: status >= 3 ? "Selesai" : "Menunggu",
        icon: "✅",
        completed: status >= 3
      },
      {
        id: 5,
        title: "Pengiriman ke Pengolah",
        description: "Kopi dikirim dari Pengepul ke Pengolah untuk pemrosesan lebih lanjut",
        date: status >= 4 ? "Dalam proses" : "Menunggu",
        icon: "🏭",
        completed: status >= 4
      },
      {
        id: 6,
        title: "Selesai Diproses",
        description: "Kopi telah selesai diproses dan siap untuk didistribusikan ke konsumen",
        date: status >= 5 ? "Selesai" : "Menunggu",
        icon: "☕",
        completed: status >= 5
      }
    ];
    
    setSteps(trackingSteps);
    
    // Generate data para pihak berdasarkan data distribusi
    const paraPihak = [
      {
        id: 1,
        role: "Petani",
        address: data.petaniAddress || "0x...",
        status: "Terverifikasi",
        isActive: true
      },
      {
        id: 2,
        role: "Pengepul",
        address: data.pengepulAddress !== 'Belum ada' ? data.pengepulAddress : "Belum ditentukan",
        status: status >= 3 ? "Terverifikasi" : "Belum ditentukan",
        isActive: status >= 2
      },
      {
        id: 3,
        role: "Pengirim",
        address: "Belum ditentukan",
        status: status >= 4 ? "Terverifikasi" : "Belum ditentukan",
        isActive: status >= 4
      },
      {
        id: 4,
        role: "Penerima",
        address: data.pengolahAddress !== 'Belum ada' ? data.pengolahAddress : "Belum ditentukan",
        status: status >= 5 ? "Terverifikasi" : "Belum ditentukan",
        isActive: status >= 5
      }
    ];
    
    setParticipants(paraPihak);
  };

  return (
    <div className="tracking-page">
      <Head>
        <title>Pelacakan Kopi | Sistem Distribusi Kopi</title>
        <meta name="description" content="Lacak perjalanan kopi Anda dari kebun hingga cangkir melalui blockchain" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <Header />
      
      {isBrowser ? (
        <main>
          <div className="container">
            <div className="page-header">
              <h1>Pelacakan <span className="gradient-text">Kopi</span></h1>
              <p className="subtitle">Lacak perjalanan kopi Anda dari kebun hingga cangkir melalui teknologi blockchain</p>
            </div>
            
            <div className="tracking-container">
              <div className="search-section">
                <form onSubmit={handleSearch}>
                  <div className="search-input">
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="Masukkan ID Pelacakan..."
                      required
                    />
                    <button type="submit" disabled={loading}>
                      {loading ? (
                        <><span className="loader-small"></span> Mencari...</>
                      ) : (
                        'Lacak'
                      )}
                    </button>
                  </div>
                </form>
                
                {error && <div className="error-message">{error}</div>}
                
                <div className="tracking-info">
                  <div className="info-card">
                    <div className="info-icon">🔍</div>
                    <h3>Bagaimana Cara Melacak?</h3>
                    <p>Masukkan ID distribusi kopi yang ingin Anda lacak. ID ini dapat ditemukan pada label produk atau kemasan kopi Anda.</p>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-icon">🔐</div>
                    <h3>Keamanan Blockchain</h3>
                    <p>Semua data distribusi kopi dicatat dalam blockchain, menjamin keaslian dan tidak dapat dimanipulasi.</p>
                  </div>
                  
                  <div className="info-card">
                    <div className="info-icon">🌐</div>
                    <h3>Transparansi</h3>
                    <p>Lihat seluruh perjalanan kopi dari petani hingga pengolahan akhir dengan detail setiap tahapan.</p>
                  </div>
                </div>
              </div>
              
              {coffeeData && (
                <div className="tracking-result">
                  <div className="result-header">
                    <h2>Informasi Kopi</h2>
                    <div className="tracking-id">ID: #{coffeeData.id}</div>
                  </div>
                  
                  <div className="tracking-grid">
                    <div className="coffee-info">
                      <div className="info-card">
                        <h3>Detail Batch</h3>
                        <div className="info-item">
                          <span className="label">Nama Batch:</span>
                          <span className="value">{coffeeData.batchName}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Jenis Kopi:</span>
                          <span className="value">{coffeeData.coffeeType}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Berat Batch:</span>
                          <span className="value">{coffeeData.batchWeight} kg</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Lokasi Kebun:</span>
                          <span className="value">{coffeeData.farmLocation}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Tanggal Panen:</span>
                          <span className="value">{coffeeData.harvestDate}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Metode Proses:</span>
                          <span className="value">{coffeeData.processingMethod}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Status:</span>
                          <span className={`value status-badge status-${coffeeData.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {coffeeData.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="para-pihak">
                      <div className="info-card">
                        <h3>Para Pihak</h3>
                        <div className="participants-flow">
                          {participants.map((participant, index) => (
                            <React.Fragment key={participant.id}>
                              <div className={`participant ${participant.isActive ? 'active' : 'inactive'}`}>
                                <div className="participant-icon"></div>
                                <div className="participant-info">
                                  <div className="participant-role">{participant.role}</div>
                                  <div className="participant-address">
                                    {participant.address === "Belum ditentukan" 
                                      ? "Belum ditentukan" 
                                      : `${participant.address.substring(0, 6)}...${participant.address.substring(participant.address.length - 4)}`}
                                  </div>
                                </div>
                              </div>
                              {index < participants.length - 1 && (
                                <div className={`flow-arrow ${participant.isActive ? 'active' : 'inactive'}`}>
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="tracking-timeline">
                    <h3>Timeline Pelacakan</h3>
                    <div className="timeline">
                      {steps.map((step) => (
                        <div key={step.id} className={`timeline-item ${step.completed ? 'completed' : 'pending'}`}>
                          <div className="timeline-icon">
                            {step.icon}
                          </div>
                          <div className="timeline-content">
                            <h4>{step.title}</h4>
                            <p>{step.description}</p>
                            <span className="timeline-date">{step.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="action-buttons">
                    <button className="btn-outline" onClick={() => router.push('/products')}>
                      Lihat Produk Kopi
                    </button>
                    <button className="btn-primary" onClick={() => window.print()}>
                      Cetak Hasil Pelacakan
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 18H18M6 14H18M6 10H18M6 6H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      ) : null}
      
      <style jsx>{`
        .tracking-page {
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
          text-align: center;
          margin-bottom: 50px;
        }
        
        h1 {
          font-size: 48px;
          font-weight: 700;
          margin: 0 0 20px;
        }
        
        .gradient-text {
          background: linear-gradient(to right, #C8A27A, #E5B168);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
          font-size: 18px;
          opacity: 0.8;
          max-width: 700px;
          margin: 0 auto;
        }
        
        .tracking-container {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        
        .search-section {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          padding: 30px;
          border: 1px solid rgba(224, 187, 145, 0.2);
        }
        
        .search-input {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .search-input input {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 14px 20px;
          color: white;
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          transition: all 0.3s;
        }
        
        .search-input input:focus {
          outline: none;
          border-color: #C8A27A;
          background: rgba(255, 255, 255, 0.15);
        }
        
        .search-input button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(90deg, #8B4513 0%, #C8A27A 100%);
          color: white;
          border: none;
          padding: 0 25px;
          border-radius: 8px;
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .search-input button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(139, 69, 19, 0.3);
        }
        
        .search-input button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        
        .error-message {
          color: #ff6b6b;
          margin-top: 10px;
          font-size: 14px;
        }
        
        .tracking-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        
        .info-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: transform 0.3s;
        }
        
        .info-card:hover {
          transform: translateY(-5px);
        }
        
        .info-icon {
          font-size: 30px;
          margin-bottom: 15px;
        }
        
        .info-card h3 {
          color: #E5B168;
          font-size: 18px;
          margin-bottom: 10px;
        }
        
        .info-card p {
          font-size: 14px;
          opacity: 0.9;
          line-height: 1.6;
        }
        
        .tracking-result {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          padding: 30px;
          border: 1px solid rgba(224, 187, 145, 0.2);
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .result-header h2 {
          font-size: 24px;
          color: #E5B168;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .tracking-id {
          font-size: 14px;
          color: white;
          font-weight: 400;
        }
        
        .tracking-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .para-pihak .info-card {
          height: 100%;
        }
        
        .participants-flow {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .participant {
          display: flex;
          align-items: center;
          padding: 12px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }
        
        .participant.active {
          background: rgba(200, 162, 122, 0.2);
          border-left: 3px solid #C8A27A;
        }
        
        .participant.inactive {
          opacity: 0.6;
        }
        
        .participant-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3C2A21;
          margin-right: 12px;
        }
        
        .participant.active .participant-icon {
          background: #8B4513;
        }
        
        .participant-info {
          flex: 1;
        }
        
        .participant-role {
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .participant-address {
          font-size: 12px;
          opacity: 0.8;
          font-family: monospace;
        }
        
        .flow-arrow {
          display: flex;
          justify-content: center;
          color: rgba(255, 255, 255, 0.5);
          height: 24px;
        }
        
        .flow-arrow.active {
          color: #C8A27A;
        }
        
        .tracking-timeline {
          margin-top: 30px;
        }
        
        .tracking-timeline h3 {
          font-size: 20px;
          margin-bottom: 20px;
          color: #E5B168;
        }
        
        .timeline {
          position: relative;
          padding-left: 45px;
        }
        
        .timeline::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 15px;
          width: 2px;
          background: rgba(255, 255, 255, 0.2);
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 30px;
        }
        
        .timeline-icon {
          position: absolute;
          left: -45px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #3C2A21;
          border: 2px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          z-index: 1;
        }
        
        .timeline-item.completed .timeline-icon {
          background: #C8A27A;
          border-color: #E5B168;
        }
        
        .timeline-content {
          padding: 15px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        .timeline-item.completed .timeline-content {
          background: rgba(200, 162, 122, 0.1);
        }
        
        .timeline-content h4 {
          font-size: 16px;
          margin-bottom: 5px;
          color: #E5B168;
        }
        
        .timeline-content p {
          font-size: 14px;
          margin-bottom: 8px;
          line-height: 1.5;
        }
        
        .timeline-date {
          display: block;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .timeline-item.pending .timeline-content {
          opacity: 0.7;
        }
        
        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 40px;
        }
        
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(90deg, #8B4513 0%, #C8A27A 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(139, 69, 19, 0.3);
        }
        
        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: white;
          border: 1px solid #C8A27A;
          padding: 12px 24px;
          border-radius: 8px;
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-outline:hover {
          background: rgba(200, 162, 122, 0.1);
          transform: translateY(-2px);
        }
        
        @media (max-width: 992px) {
          .tracking-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          h1 {
            font-size: 36px;
          }
          
          .result-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .tracking-grid {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .btn-primary, .btn-outline {
            width: 100%;
            justify-content: center;
          }
        }
        
        @media print {
          .tracking-page {
            background: white;
            color: black;
          }
          
          main {
            padding: 20px;
          }
          
          .search-section, .action-buttons, header {
            display: none;
          }
          
          .tracking-result {
            border: 1px solid #ddd;
            border-radius: 0;
            background: white;
          }
          
          .result-header h2, .tracking-timeline h3, .timeline-content h4, .detail-item h4 {
            color: #8B4513;
          }
          
          .timeline::before {
            background: #ddd;
          }
          
          .timeline-content, .detail-item, .timeline-item.completed .timeline-content {
            background: #f9f9f9;
          }
          
          .timeline-item.completed .timeline-icon {
            background: #8B4513;
            color: white;
          }
        }
      `}</style>
    </div>
  );
};

export default Tracking; 