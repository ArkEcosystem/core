const bip39 = require('bip39')
const { client, crypto } = require('@arkecosystem/client')

module.exports = (network, amount = 10) => {
  client.getConfigManager().setFromPreset('ark', 'devnet')

  let wallets = {}

  for (var i = amount - 1; i >= 0; i--) {
      const passphrase = bip39.generateMnemonic()
      const address = crypto.getAddress(crypto.getKeys(passphrase).publicKey)

      wallets[address] = passphrase
  }

  return wallets
}
