import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      
      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .main-content {
          flex: 1;
          padding-top: 80px; /* Adjust based on your header height */
          background-color: #f9f9f9;
        }
      `}</style>
    </div>
  );
};

export default Layout; 