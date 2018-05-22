const assert = require('assert')
const bip39 = require('bip39')
const { client, crypto } = require('@arkecosystem/crypto')

module.exports = (network, quantity = 10) => {
  network = network || 'devnet'
  assert.true(['mainnet', 'devnet'].includes(network), 'Invalid network')

  client.getConfigManager().setFromPreset('ark', network)

  let wallets = {}

  for (let i = 0; i < quantity; i++) {
      const passphrase = bip39.generateMnemonic()
      const address = crypto.getAddress(crypto.getKeys(passphrase).publicKey)

      wallets[address] = passphrase
  }

  return wallets
}
