# Sistem Distribusi Kopi Berbasis Blockchain

Sistem distribusi kopi berbasis blockchain ini mengimplementasikan seluruh proses distribusi kopi dari petani hingga penerima akhir menggunakan smart contract Ethereum.

## Proses Distribusi Kopi

Berikut adalah alur proses distribusi kopi yang diimplementasikan dalam sistem:

### 1. Koneksi Wallet dan Registrasi Role
- Pengguna melakukan koneksi wallet (MetaMask) ke aplikasi
- Smart contract memeriksa role pengguna melalui fungsi `roles(address)` 
- Jika belum memiliki role, pengguna harus mendaftar melalui fungsi `registerRole(uint8)`
- Role yang tersedia: Petani(1), Pengepul(2), Pengirim(3), Penerima/Pabrik(4)

### 2. Alur Petani
- **Petani** (Role=1) menginput data panen kopi baru
- Data meliputi: lokasi, berat, tanggal panen, dan alamat pengepul
- Data dikirim ke blockchain melalui fungsi `tambahDistribusi(string, uint256, string, address)`
- Smart contract menetapkan status awal: **Dikirim ke Pengepul**
- ID distribusi dibuat dan dicatat dalam blockchain

### 3. Alur Pengepul
- **Pengepul** (Role=2) melakukan validasi data yang dikirim oleh petani
- Pengepul memilih dan menetapkan pengirim melalui fungsi `validasiPengepul(uint256, address)`
- Pengepul juga dapat menetapkan penerima melalui fungsi `setDistribusiPenerima(uint256, address)`
- Smart contract mengubah status menjadi: **Dikirim ke Penerima**

### 4. Alur Pengirim
- **Pengirim** (Role=3) menerima distribusi kopi dari pengepul
- Pengirim memperbarui status pengiriman dengan fungsi `updateStatusPengiriman(uint256, bool)`
- Status dapat diperbarui menjadi:
  - **Dalam Perjalanan** (sampaiTujuan = false)
  - **Sampai Tujuan** (sampaiTujuan = true)

### 5. Alur Penerima/Pabrik
- **Penerima** (Role=4) melakukan validasi akhir ketika kopi telah sampai
- Validasi dilakukan melalui fungsi `validasiAkhirDistribusi(uint256)`
- Smart contract mengubah status menjadi: **Validasi Akhir**

### 6. Data Final
- Seluruh proses distribusi kopi telah tercatat secara permanen di blockchain
- Setiap pihak dapat melacak dan melihat status distribusi kopi melalui fungsi `getDistribusi()` dan `getStatusText()`

## Status Distribusi Kopi
Status distribusi kopi mengikuti enum Status dalam kontrak:
1. Ditanam
2. Dikirim ke Pengepul
3. Diterima Pengepul
4. Dikirim ke Penerima
5. Dalam Perjalanan
6. Sampai Tujuan
7. Validasi Akhir

## Keamanan dan Validasi
- Setiap fungsi smart contract memiliki verifikasi terhadap role pengguna
- Fungsi dibatasi dengan modifier `onlyRole` untuk memastikan hanya pihak berwenang yang dapat mengakses
- Setiap transaksi memerlukan tanda tangan digital dari wallet yang terhubung

## Transparansi
- Seluruh stakeholder dapat melihat status distribusi secara real-time
- Seluruh data tersimpan secara permanen dan tidak dapat dimanipulasi
- Data dapat diverifikasi oleh semua pihak yang terlibat dalam proses distribusi

## Detail Kontrak
- Alamat Kontrak: 0x7595da24C3865365F2e435A9dE8f7d9521Ad4340
- Network: Sepolia Testnet
- Solidity Version: ^0.8.0
