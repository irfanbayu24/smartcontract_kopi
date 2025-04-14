const web3 = require("./web3");
const DistribusiKopi = require("./artifacts/contracts/DistribusiKopi.sol/DistribusiKopi.json");

const contractAddress = '0x7595da24C3865365F2e435A9dE8f7d9521Ad4340';

const distribusi = () => {
  // Create contract instance using Web3 v4.x syntax
  return new web3.eth.Contract(
    DistribusiKopi.abi,
    contractAddress
  );
};

module.exports = distribusi;