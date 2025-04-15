// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DistribusiKopi {
    enum Role { None, Petani, Pengepul, Pengirim, Penerima }
    enum Status { Ditanam, DikirimKePengepul, DiterimaPengepul, DikirimKePenerima, DalamPerjalanan, SampaiTujuan, ValidasiAkhir }

    struct DistribusiKopiData {
        address petani;
        address pengepul;
        address pengirim;
        address penerima;
        string lokasi;
        uint256 berat;
        string tanggalPanen;
        Status status;
    }

    mapping(address => Role) public roles;
    mapping(uint256 => DistribusiKopiData) public distribusi;
    uint256 public distribusiCounter;

    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Tidak memiliki akses");
        _;
    }

    function registerRole(uint8 _role) external {
        require(_role > 0 && _role <= 4, "Role tidak valid");
        require(roles[msg.sender] == Role.None, "Sudah terdaftar");
        roles[msg.sender] = Role(_role);
    }

    function tambahDistribusi(
        string memory _lokasi,
        uint256 _berat,
        string memory _tanggalPanen,
        address _pengepul
    ) external onlyRole(Role.Petani) {
        distribusiCounter++;
        distribusi[distribusiCounter] = DistribusiKopiData(
            msg.sender,
            _pengepul,
            address(0),
            address(0),
            _lokasi,
            _berat,
            _tanggalPanen,
            Status.DikirimKePengepul
        );
    }

    function validasiPengepul(uint256 _id, address _pengirim) external onlyRole(Role.Pengepul) {
        require(distribusi[_id].pengepul == msg.sender, "Bukan pengepul yang sah");
        distribusi[_id].pengirim = _pengirim;
        distribusi[_id].status = Status.DikirimKePenerima;
    }

    function setDistribusiPenerima(uint256 _id, address _penerima) external onlyRole(Role.Pengepul) {
        require(distribusi[_id].pengepul == msg.sender, "Bukan pengepul yang sah");
        require(roles[_penerima] == Role.Penerima, "Alamat bukan penerima terdaftar");
        distribusi[_id].penerima = _penerima;
    }

    function updateStatusPengiriman(uint256 _id, bool sampaiTujuan) external onlyRole(Role.Pengirim) {
        require(distribusi[_id].pengirim == msg.sender, "Bukan pengirim yang sah");
        distribusi[_id].status = sampaiTujuan ? Status.SampaiTujuan : Status.DalamPerjalanan;
    }

    function validasiAkhirDistribusi(uint256 _id) external onlyRole(Role.Penerima) {
        distribusi[_id].penerima = msg.sender;
        distribusi[_id].status = Status.ValidasiAkhir;
    }

    // View Functions
    function getDistribusi(uint256 _id) public view returns (DistribusiKopiData memory) {
        return distribusi[_id];
    }

    function getStatusText(uint256 _id) public view returns (string memory) {
        Status s = distribusi[_id].status;
        if (s == Status.Ditanam) return "Ditanam";
        if (s == Status.DikirimKePengepul) return "Dikirim ke Pengepul";
        if (s == Status.DiterimaPengepul) return "Diterima Pengepul";
        if (s == Status.DikirimKePenerima) return "Dikirim ke Penerima";
        if (s == Status.DalamPerjalanan) return "Dalam Perjalanan";
        if (s == Status.SampaiTujuan) return "Sampai Tujuan";
        if (s == Status.ValidasiAkhir) return "Validasi Akhir";
        return "Unknown";
    }
}
