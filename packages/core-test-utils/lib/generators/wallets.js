const bip39 = require('bip39')
const { client, crypto } = require('@arkecosystem/crypto')

module.exports = (network, quantity = 10) => {
  network = network || 'testnet'
  if (!['testnet', 'mainnet', 'devnet'].includes(network)) {
    throw new Error('Invalid network')
  }

  client.getConfigManager().setFromPreset('ark', network)

  const wallets = []
  for (let i = 0; i < quantity; i++) {
    const passphrase = bip39.generateMnemonic()
    const address = crypto.getAddress(crypto.getKeys(passphrase).publicKey)

    wallets.push({ address, passphrase })
  }

  return wallets
}
