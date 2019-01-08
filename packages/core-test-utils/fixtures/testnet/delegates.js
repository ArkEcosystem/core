const { client, crypto } = require('@arkecosystem/crypto')

/**
 * Get the testnet genesis delegates information
 * @return {Array} array of objects like { secret, publicKey, address, balance }
 */

client.getConfigManager().setFromPreset('ark', 'testnet')

const delegatesConfig = require('../../config/testnet/delegates.json')
const genesisTransactions = require('../../config/testnet/genesisBlock.json')
  .transactions

module.exports = delegatesConfig.secrets.map(secret => {
  const publicKey = crypto.getKeys(secret).publicKey
  const address = crypto.getAddress(publicKey)
  const balance = genesisTransactions.find(
    transaction =>
      transaction.recipientId === address && transaction.type === 0,
  ).amount
  return {
    secret,
    passphrase: secret, // just an alias for delegate secret
    publicKey,
    address,
    balance,
  }
})
