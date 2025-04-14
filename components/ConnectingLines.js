import React from 'react';

const ConnectingLines = () => {
  return (
    <div className="connecting-line">
      <div className="line"></div>
      <div className="arrow"></div>
      
      <style jsx>{`
        .connecting-line {
          display: flex;
          align-items: center;
          height: 30px;
          margin-left: 20px;
          position: relative;
          overflow: visible;
        }
        
        .line {
          height: 100%;
          width: 2px;
          background: rgba(200, 162, 122, 0.3);
          margin-left: 19px;
        }
        
        .arrow {
          position: absolute;
          bottom: 0;
          left: 15px;
          width: 10px;
          height: 10px;
          border-right: 2px solid rgba(200, 162, 122, 0.6);
          border-bottom: 2px solid rgba(200, 162, 122, 0.6);
          transform: rotate(45deg);
        }
        
        @media (max-width: 480px) {
          .connecting-line {
            height: 25px;
            margin-left: 16px;
          }
          
          .line {
            margin-left: 16px;
          }
          
          .arrow {
            left: 12px;
            width: 8px;
            height: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default ConnectingLines; 