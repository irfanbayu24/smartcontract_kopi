import React, { useEffect } from 'react';
import 'semantic-ui-css/semantic.min.css';
import '../styles/globals.css';
import Script from 'next/script';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  // Suppress hydration warnings from browser extensions
  useEffect(() => {
    // This runs only on the client after hydration
    // Find and remove any elements injected by browser extensions
    const extensionElements = document.querySelectorAll('[id^="extwaiokist"], [id^="ext-"], [class^="ext-"]');
    extensionElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      {/* Add Web3.js from CDN as a fallback */}
      <Script
        src="https://cdn.jsdelivr.net/npm/web3@4.16.0/dist/web3.min.js"
        strategy="beforeInteractive"
      />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 