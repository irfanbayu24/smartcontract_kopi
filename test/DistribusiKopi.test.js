const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DistribusiKopi", function () {
  let contract;
  let owner, petani, pengepul, pengirim, penerima;

  beforeEach(async () => {
    [owner, petani, pengepul, pengirim, penerima] = await ethers.getSigners();

    const DistribusiKopi = await ethers.getContractFactory("DistribusiKopi");
    contract = await DistribusiKopi.deploy();

    // Register roles
    await contract.connect(petani).registerRole(1);    // Petani
    await contract.connect(pengepul).registerRole(2);   // Pengepul
    await contract.connect(pengirim).registerRole(3);   // Pengirim
    await contract.connect(penerima).registerRole(4);   // Penerima
  });

  it("Petani dapat menambahkan distribusi", async () => {
    await contract.connect(petani).tambahDistribusi(
      "Aceh",
      100,
      "2025-04-09",
      pengepul.address
    );

    const distribusi = await contract.getDistribusi(1);
    expect(distribusi.lokasi).to.equal("Aceh");
    expect(distribusi.berat).to.equal(100);
    expect(distribusi.pengepul).to.equal(pengepul.address);
  });

  it("Pengepul dapat memvalidasi dan menetapkan pengirim", async () => {
    await contract.connect(petani).tambahDistribusi("Toraja", 200, "2025-04-09", pengepul.address);

    await contract.connect(pengepul).validasiPengepul(1, pengirim.address);

    const distribusi = await contract.getDistribusi(1);
    expect(distribusi.pengirim).to.equal(pengirim.address);
  });

  it("Pengirim dapat mengubah status pengiriman", async () => {
    await contract.connect(petani).tambahDistribusi("Bali", 150, "2025-04-09", pengepul.address);
    await contract.connect(pengepul).validasiPengepul(1, pengirim.address);

    await contract.connect(pengirim).updateStatusPengiriman(1, true);

    const statusText = await contract.getStatusText(1);
    expect(statusText).to.equal("Sampai Tujuan");
  });

  it("Penerima dapat memvalidasi akhir distribusi", async () => {
    await contract.connect(petani).tambahDistribusi("Java", 180, "2025-04-09", pengepul.address);
    await contract.connect(pengepul).validasiPengepul(1, pengirim.address);
    await contract.connect(pengirim).updateStatusPengiriman(1, true);
    await contract.connect(penerima).validasiAkhirDistribusi(1);

    const statusText = await contract.getStatusText(1);
    expect(statusText).to.equal("Validasi Akhir");
  });
});
