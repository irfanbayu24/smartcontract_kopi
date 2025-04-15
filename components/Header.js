import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Import distribusi module using relative path from component to root
let distribusi;
try {
  // Try direct import first, fallback to a null function if it fails
  distribusi = require('../distribusi');
} catch (error) {
  console.error('Error importing distribusi module:', error);
  distribusi = () => null;
}

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userRole, setUserRole] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Add event listener
    window.addEventListener('scroll', handleScroll);

    // Cleanup event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Check wallet connection and user role
  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          
          // Check user role
          if (distribusi) {
            const contract = distribusi();
            if (contract && contract.methods) {
              try {
                const role = await contract.methods.roles(accounts[0]).call();
                setUserRole(parseInt(role));
              } catch (roleError) {
                console.error('Error checking user role:', roleError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };
    
    checkConnection();
    
    // Listen for account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        
        // Check user role on account change
        if (distribusi) {
          const checkRole = async () => {
            try {
              const contract = distribusi();
              if (contract && contract.methods) {
                const role = await contract.methods.roles(accounts[0]).call();
                setUserRole(parseInt(role));
              }
            } catch (error) {
              console.error('Error checking role:', error);
            }
          };
          
          checkRole();
        }
      } else {
        setWalletAddress('');
        setIsConnected(false);
        setUserRole(0);
      }
    };
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    
    // Clean up event listener
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

    return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="logo">
          <Link href="/">
            <span className="logo-text">DISTRIBUSI KOPI</span>
          </Link>
        </div>

        <nav className={`nav ${isMobileMenuOpen ? 'active' : ''}`}>
          <ul className="nav-list">
            <li>
              <Link href="/produk" className={router.pathname === '/produk' ? 'active' : ''}>
                Produk
              </Link>
            </li>
            <li>
              <Link href="/distribusi" className={router.pathname.startsWith('/distribusi') ? 'active' : ''}>
                Distribusi
              </Link>
            </li>
            <li>
              <Link href="/tracking" className={router.pathname === '/tracking' ? 'active' : ''}>
                Pelacakan
              </Link>
            </li>
            <li>
              <Link href="/#contact" className={router.pathname === '/#contact' ? 'active' : ''}>
                Kontak
            </Link>
            </li>
          </ul>
        </nav>

        <div className="actions">
          {isConnected && (
            <div className="dashboard-links">
              {userRole === 1 && (
                <Link href="/petani/dashboard">
                  <button className="btn-dashboard">Dashboard Petani</button>
                </Link>
              )}
              {userRole === 2 && (
                <Link href="/pengepul/dashboard">
                  <button className="btn-dashboard">Dashboard Pengepul</button>
                </Link>
              )}
              {userRole === 3 && (
                <Link href="/pengirim/dashboard">
                  <button className="btn-dashboard">Dashboard Pengirim</button>
                </Link>
              )}
            </div>
          )}
          
          {(!isConnected || (userRole !== 4)) && (
            <Link href="/distribusi/new">
              <button className="btn-primary">Distribusi Baru</button>
            </Link>
          )}

          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            <div className={`menu-icon ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 20px 0;
          z-index: 1000;
          transition: all 0.3s ease;
          background: rgba(26, 18, 11, 0.9);
        }

        .header.scrolled {
          padding: 15px 0;
          background: rgba(26, 18, 11, 0.95);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 22px;
          font-weight: 700;
          color: #E5B168;
        }

        .logo-text {
          background: linear-gradient(to right, #E5B168, #C8A27A);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          cursor: pointer;
        }

        .nav-list {
          display: flex;
          gap: 30px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-list li a {
          color: white;
          text-decoration: none;
          font-size: 16px;
          font-weight: 500;
          transition: color 0.3s ease;
          position: relative;
        }

        .nav-list li a:hover,
        .nav-list li a.active {
          color: #E5B168;
        }

        .nav-list li a:after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -5px;
          left: 0;
          background-color: #E5B168;
          transition: width 0.3s ease;
        }

        .nav-list li a:hover:after,
        .nav-list li a.active:after {
          width: 100%;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .dashboard-links {
          display: flex;
          align-items: center;
        }

        .btn-dashboard {
          background: linear-gradient(90deg, #3C2A21, #8B4513);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .btn-dashboard:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(139, 69, 19, 0.3);
        }

        .btn-primary {
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

        .mobile-menu-toggle {
          display: none;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-left: 20px;
        }

        .menu-icon {
          display: flex;
          flex-direction: column;
          width: 30px;
          cursor: pointer;
        }

        .menu-icon span {
          background: white;
          border-radius: 10px;
          height: 3px;
          margin: 3px 0;
          transition: .4s cubic-bezier(0.68, -0.6, 0.32, 1.6);
        }

        .menu-icon span:nth-of-type(1) {
          width: 50%;
        }

        .menu-icon span:nth-of-type(2) {
          width: 100%;
        }

        .menu-icon span:nth-of-type(3) {
          width: 75%;
        }

        .menu-icon.active span:nth-of-type(1) {
          transform-origin: bottom;
          transform: rotatez(45deg) translate(5px, 1px);
          width: 35%;
        }

        .menu-icon.active span:nth-of-type(2) {
          transform-origin: top;
          transform: rotatez(-45deg);
        }

        .menu-icon.active span:nth-of-type(3) {
          transform-origin: bottom;
          transform: translate(8px, -6px) rotatez(45deg);
          width: 35%;
        }

        @media (max-width: 900px) {
          .mobile-menu-toggle {
            display: block;
          }

          .nav {
            position: fixed;
            top: 70px;
            left: 0;
            width: 100%;
            padding: 20px;
            background: rgba(26, 18, 11, 0.98);
            box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
            transform: translateY(-150%);
            transition: transform 0.3s ease-in-out;
            z-index: 999;
          }

          .nav.active {
            transform: translateY(0);
          }

          .nav-list {
            flex-direction: column;
            gap: 15px;
            padding: 10px 0;
          }

          .nav-list li a {
            display: block;
            padding: 10px 0;
            font-size: 18px;
          }
          
          .dashboard-links {
            display: none;
          }
        }

        @media (max-width: 600px) {
          .header {
            padding: 15px 0;
          }
          
          .logo {
            font-size: 18px;
          }
          
          .btn-primary {
            padding: 8px 16px;
            font-size: 14px;
          }
          
          .container {
            padding: 0 16px;
          }
        }
      `}</style>
    </header>
    );
};

export default Header;