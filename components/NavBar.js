import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Web3 from 'web3';
import distributionContract from '../ethereum/distribution';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userRole, setUserRole] = useState(0);
  const router = useRouter();

  // Navigation items
  const navigationItems = [
    { name: 'Produk', href: '/product', scroll: false },
    { name: 'Distribusi', href: '/distribusi', scroll: false },
    { name: 'Kontak', href: '/#contact', scroll: true },
  ];

  // ... existing code ...
}; 