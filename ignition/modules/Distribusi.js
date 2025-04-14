const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const DistribusiModule = buildModule("DistribusiModule", (m) => {
    // Deploy DistribusiFactory terlebih dahulu
    const factory = m.contract("DistribusiKopi");

    // Fungsi untuk mendapatkan ABI dan address
    const getContractData = async () => {
        const factoryContract = await factory.deployed();
        return {
            factory: {
                address: factoryContract.address,
                abi: factoryContract.interface.format('json')
            }
        };
    };

    // Export data yang diperlukan
    return {
        factory,
        getContractData
    };
});

module.exports = DistribusiModule;