// config/solana.js
const { Connection, clusterApiUrl } = require('@solana/web3.js');

const network = clusterApiUrl('devnet'); // Change to 'mainnet-beta' for production
const connection = new Connection(network, 'confirmed');

module.exports = { connection };
