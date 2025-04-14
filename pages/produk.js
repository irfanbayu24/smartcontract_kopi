import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';

const Produk = () => {
  const router = useRouter();
  
  const coffeeProducts = [
    {
      id: 'arabica',
      name: 'Arabica',
      image: 'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      shortDesc: 'Terkenal dengan rasa yang halus dan aroma yang kaya',
      history: 'Kopi Arabica (Coffea arabica) berasal dari dataran tinggi Ethiopia dan ditemukan sekitar tahun 1000 M. Kopi ini kemudian menyebar ke Yaman dan seluruh Timur Tengah sebelum akhirnya dibawa ke Eropa pada abad ke-17. Saat ini, Arabica merupakan sekitar 60-70% produksi kopi dunia. Arabica tumbuh optimal pada ketinggian 1.000-2.000 meter di atas permukaan laut dengan suhu 15-24°C.',
      characteristics: [
        'Rasa halus dengan keasaman yang seimbang',
        'Aroma kompleks dengan sentuhan buah dan bunga',
        'Kandungan kafein lebih rendah (0.8-1.4%)',
        'Bentuk biji oval dan lebih besar'
      ],
      regions: 'Ethiopia, Colombia, Guatemala, Brazil, Indonesia (Gayo, Toraja, Kintamani)'
    },
    {
      id: 'robusta',
      name: 'Robusta',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd0d65?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      shortDesc: 'Karakter kuat dengan kandungan kafein tinggi',
      history: 'Kopi Robusta (Coffea canephora) pertama kali ditemukan di Afrika Tengah dan Barat, terutama di Congo. Robusta mendapatkan namanya karena ketahanannya terhadap penyakit dan kemampuannya untuk tumbuh dalam kondisi yang lebih keras. Robusta mulai populer pada awal abad ke-20 ketika penyakit karat daun kopi menyerang perkebunan Arabica di Asia. Saat ini, Vietnam adalah produsen Robusta terbesar di dunia, diikuti oleh Brasil dan Indonesia.',
      characteristics: [
        'Rasa lebih pahit dan kuat dengan sentuhan kayu dan kacang',
        'Aroma lebih sederhana dibanding Arabica',
        'Kandungan kafein lebih tinggi (1.7-4%)',
        'Bentuk biji lebih bulat dan kecil'
      ],
      regions: 'Vietnam, Brazil, Indonesia (Lampung, Jawa), Uganda, India'
    },
    {
      id: 'liberica',
      name: 'Liberica',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      shortDesc: 'Langka dengan profil rasa yang unik',
      history: 'Kopi Liberica (Coffea liberica) berasal dari Liberia, Afrika Barat. Jenis kopi ini menjadi populer pada akhir abad ke-19 ketika penyakit karat daun kopi menghancurkan tanaman Arabica di Asia Tenggara. Di Filipina, khususnya di daerah Batangas, Liberica (dikenal sebagai Barako) menjadi bagian penting dari budaya kopi. Saat ini, Liberica hanya menyumbang sekitar 1-2% produksi kopi global dan dianggap sebagai kopi langka.',
      characteristics: [
        'Rasa buah yang kuat dengan sentuhan rempah dan kayu',
        'Aroma harum dan kuat',
        'Biji sangat besar dengan bentuk asimetris',
        'Daun dan pohon yang lebih besar dari jenis kopi lainnya'
      ],
      regions: 'Malaysia, Filipina, Indonesia, Afrika Barat'
    },
    {
      id: 'excelsa',
      name: 'Excelsa',
      image: 'https://images.unsplash.com/photo-1587734361993-0033759da68a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      shortDesc: 'Kombinasi unik rasa ringan dan kuat',
      history: 'Kopi Excelsa (sekarang diklasifikasikan sebagai varietas dari Coffea liberica) ditemukan di Afrika Tengah pada akhir abad ke-19. Awalnya dianggap sebagai spesies terpisah, tetapi ahli taksonomi kemudian menggolongkannya sebagai varietas dari Liberica karena kesamaan genetik. Excelsa telah dibudidayakan secara komersial di Asia Tenggara sejak awal abad ke-20 dan dikenal karena kemampuannya untuk tumbuh dalam kondisi yang tidak ideal untuk jenis kopi lainnya.',
      characteristics: [
        'Profil rasa unik dengan karakter buah yang tart dan sentuhan rasa panggang',
        'Menggabungkan karakteristik ringan dari Arabica dengan kekuatan Robusta',
        'Biji berukuran menengah dengan bentuk memanjang',
        'Pohon dapat tumbuh hingga 20-30 kaki, lebih tinggi dari Arabica dan Robusta'
      ],
      regions: 'Vietnam, Filipina, Indonesia, Afrika Tengah'
    }
  ];

  return (
    <div className="products-page">
      <Head>
        <title>Produk Kopi | Sistem Distribusi Kopi</title>
        <meta name="description" content="Berbagai jenis produk kopi premium yang didistribusikan melalui blockchain" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <Header />
      
      <main>
        <div className="container">
          <div className="page-header">
            <h1>Produk <span className="gradient-text">Kopi</span></h1>
            <p className="subtitle">Berbagai jenis kopi premium dengan kualitas terjamin melalui pelacakan blockchain</p>
          </div>
          
          <div className="coffee-products">
            {coffeeProducts.map(coffee => (
              <div className="coffee-card" key={coffee.id}>
                <div className="coffee-image">
                  <img src={coffee.image} alt={coffee.name} />
                </div>
                <div className="coffee-content">
                  <h2>{coffee.name}</h2>
                  <p className="short-desc">{coffee.shortDesc}</p>
                  
                  <h3>Sejarah</h3>
                  <p className="history">{coffee.history}</p>
                  
                  <h3>Karakteristik</h3>
                  <ul className="characteristics">
                    {coffee.characteristics.map((characteristic, index) => (
                      <li key={index}>{characteristic}</li>
                    ))}
                  </ul>
                  
                  <h3>Daerah Penghasil</h3>
                  <p className="regions">{coffee.regions}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="other-info">
            <h2>Pengaruh Distribusi <span className="gradient-text">Blockchain</span></h2>
            <p>
              Sistem distribusi blockchain kami memastikan setiap biji kopi dapat dilacak asal-usulnya, sehingga memberikan 
              jaminan kualitas dan keaslian produk. Setiap tahapan distribusi kopi dari perkebunan hingga proses 
              pengiriman tercatat dalam blockchain, memberikan transparansi penuh kepada konsumen.
            </p>
            <button 
              className="btn-primary"
              onClick={() => router.push('/distribusi')}
            >
              Lihat Distribusi Kopi
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
      
      <style jsx>{`
        .products-page {
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
        
        .coffee-products {
          display: flex;
          flex-direction: column;
          gap: 50px;
        }
        
        .coffee-card {
          display: flex;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(224, 187, 145, 0.2);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .coffee-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }
        
        .coffee-image {
          flex: 0 0 40%;
          position: relative;
          overflow: hidden;
        }
        
        .coffee-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s;
        }
        
        .coffee-card:hover .coffee-image img {
          transform: scale(1.05);
        }
        
        .coffee-content {
          flex: 0 0 60%;
          padding: 30px;
        }
        
        .coffee-content h2 {
          color: #E5B168;
          font-size: 28px;
          margin: 0 0 10px;
        }
        
        .short-desc {
          font-size: 18px;
          margin-bottom: 20px;
          opacity: 0.9;
        }
        
        .coffee-content h3 {
          color: #C8A27A;
          font-size: 18px;
          margin: 20px 0 10px;
        }
        
        .history {
          line-height: 1.6;
          margin-bottom: 15px;
        }
        
        .characteristics {
          padding-left: 20px;
          margin: 10px 0 15px;
        }
        
        .characteristics li {
          margin-bottom: 8px;
          position: relative;
        }
        
        .characteristics li::before {
          content: '•';
          color: #C8A27A;
          position: absolute;
          left: -15px;
        }
        
        .regions {
          background: rgba(0, 0, 0, 0.2);
          padding: 8px 12px;
          border-radius: 6px;
          margin-top: 10px;
          display: inline-block;
        }
        
        .other-info {
          margin-top: 60px;
          text-align: center;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          padding: 40px;
          border: 1px solid rgba(224, 187, 145, 0.2);
        }
        
        .other-info h2 {
          font-size: 28px;
          margin-bottom: 20px;
        }
        
        .other-info p {
          max-width: 800px;
          margin: 0 auto 30px;
          line-height: 1.6;
        }
        
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
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
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(139, 69, 19, 0.3);
        }
        
        .btn-primary:hover svg {
          transform: translateX(4px);
        }
        
        .btn-primary svg {
          transition: transform 0.2s;
        }
        
        @media (max-width: 992px) {
          .coffee-card {
            flex-direction: column;
          }
          
          .coffee-image {
            height: 300px;
          }
        }
        
        @media (max-width: 768px) {
          h1 {
            font-size: 36px;
          }
          
          .coffee-content {
            padding: 20px;
          }
          
          .coffee-content h2 {
            font-size: 24px;
          }
          
          .coffee-content h3 {
            font-size: 16px;
          }
          
          .other-info {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default Produk; 