import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import ConnectingLines from '../components/ConnectingLines';
import dynamic from 'next/dynamic';

// Client-side only component for wallet connection
const WalletConnectionSection = dynamic(() => import('../components/WalletConnection'), {
  ssr: false,
});

const Home = () => {
  return (
    <div className="landing-page">
      <Head>
        <title>Sistem Distribusi Kopi</title>
        <meta name="description" content="Sistem Distribusi Kopi Blockchain" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Header />

      {/* Connecting lines background */}
      <ConnectingLines />

      {/* Floating elements */}
      <div className="floating-elements">
        <div className="coffee-bean bean-1"></div>
        <div className="coffee-bean bean-2"></div>
        <div className="coffee-bean bean-3"></div>
        <div className="coffee-bean bean-4"></div>
        <div className="steam steam-1"></div>
        <div className="steam steam-2"></div>
      </div>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="label">NEW</div>
            <h1>Distribusi Kopi <span className="gradient-text">Blockchain</span></h1>
            <h2>Dari Petani ke Cangkir Anda</h2>
            <p>
              Cepat, terjangkau, dan transparan. Platform kami memungkinkan penelusuran 
              yang cepat antara perkebunan kopi, pengolahan, dan konsumen dalam satu koneksi, 
              dengan satu klik. Didukung oleh teknologi blockchain.
            </p>
            
            <div className="cta-buttons">
              <WalletConnectionSection />
            </div>
          </div>
        </section>
      </main>

      <section className="contact-section">
        <div className="container">
          <div className="contact-header">
            <span className="subheading">Get In Touch</span>
            <h2>Contact Me</h2>
          </div>
          
          <div className="contact-links">
            <a href="mailto:irfanbayuseno@gmail.com" className="contact-link">
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
            </a>
            <a href="https://www.linkedin.com/in/irfan-bayu-seno" target="_blank" rel="noopener noreferrer" className="contact-link">
              <div className="contact-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
            </a>
          </div>
        </div>
      </section>

      <style jsx>{`
        .landing-page {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(to bottom, #1A120B, #3C2A21);
          color: white;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        .landing-page::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at top right, rgba(224, 187, 145, 0.2), transparent 60%),
                    radial-gradient(circle at bottom left, rgba(135, 82, 45, 0.2), transparent 60%);
          z-index: 1;
        }

        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
        }

        .coffee-bean {
          position: absolute;
          background-color: #5D4037;
          border-radius: 50%;
          transform: rotate(45deg);
        }

        .coffee-bean::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 60%;
          height: 60%;
          transform: translate(-50%, -50%);
          border-radius: 50% 0 50% 0;
          background-color: #3C2A21;
        }

        .bean-1 {
          width: 80px;
          height: 100px;
          top: 15%;
          right: 10%;
          opacity: 0.6;
          animation: float 15s ease-in-out infinite;
        }

        .bean-2 {
          width: 60px;
          height: 75px;
          bottom: 10%;
          left: 15%;
          opacity: 0.5;
          animation: float 20s ease-in-out infinite;
          animation-delay: 2s;
        }

        .bean-3 {
          width: 40px;
          height: 50px;
          top: 40%;
          right: 25%;
          opacity: 0.4;
          animation: float 18s ease-in-out infinite;
          animation-delay: 4s;
        }

        .bean-4 {
          width: 50px;
          height: 65px;
          top: 30%;
          left: 10%;
          opacity: 0.3;
          animation: float 22s ease-in-out infinite;
          animation-delay: 3s;
        }

        .steam {
          position: absolute;
          background: radial-gradient(circle at bottom, rgba(255,255,255,0.3), transparent 70%);
          border-radius: 50%;
          filter: blur(8px);
          animation: steaming 5s infinite ease-in-out;
        }

        .steam-1 {
          width: 120px;
          height: 120px;
          top: 20%;
          left: 20%;
          animation-delay: 1s;
        }

        .steam-2 {
          width: 180px;
          height: 180px;
          bottom: 20%;
          right: 20%;
          animation-delay: 3s;
        }

        @keyframes steaming {
          0%, 100% {
            opacity: 0.1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 0.3;
            transform: translateY(-30px) scale(1.2);
          }
        }

        main {
          position: relative;
          z-index: 2;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 40px 20px;
        }

        .hero-content {
          max-width: 800px;
          text-align: center;
        }

        .label {
          display: inline-block;
          background: rgba(135, 82, 45, 0.5);
          border: 1px solid rgba(224, 187, 145, 0.4);
          color: white;
          font-size: 14px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 30px;
          margin-bottom: 30px;
        }

        h1 {
          font-size: 70px;
          font-weight: 700;
          margin: 0 0 10px;
          line-height: 1.1;
          letter-spacing: -1px;
        }

        .gradient-text {
          background: linear-gradient(to right, #C8A27A, #E5B168);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        h2 {
          font-size: 36px;
          font-weight: 600;
          margin: 0 0 30px;
          opacity: 0.9;
        }

        p {
          font-size: 18px;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto 40px;
          opacity: 0.8;
        }

        .cta-buttons {
          display: flex;
          justify-content: center;
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 50px;
          }
          h2 {
            font-size: 28px;
          }
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 36px;
          }
          h2 {
            font-size: 22px;
          }
        }

        .contact-section {
          padding: 80px 0;
          text-align: center;
          background: rgba(0, 0, 0, 0.1);
          border-top: 1px solid rgba(224, 187, 145, 0.2);
        }
        
        .contact-header {
          margin-bottom: 40px;
        }
        
        .contact-header .subheading {
          display: block;
          font-size: 16px;
          color: #C8A27A;
          margin-bottom: 10px;
        }
        
        .contact-header h2 {
          font-size: 42px;
          font-weight: 700;
          color: white;
        }
        
        .contact-links {
          display: flex;
          justify-content: center;
          gap: 50px;
        }
        
        .contact-link {
          text-decoration: none;
          color: white;
        }
        
        .contact-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(224, 187, 145, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        
        .contact-icon:hover {
          transform: translateY(-5px);
          background: linear-gradient(90deg, #8B4513 0%, #C8A27A 100%);
          border-color: transparent;
          box-shadow: 0 10px 20px rgba(139, 69, 19, 0.3);
        }
        
        @media (max-width: 768px) {
          .contact-header h2 {
            font-size: 32px;
          }
        }
      `}</style>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        html, body {
          padding: 0;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default Home;