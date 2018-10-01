const bip39 = require('bip39')
const { crypto } = require('@arkecosystem/crypto')

module.exports = (quantity = 1, config) => {
  let wallets = []

  for (let i = 0; i < quantity; i++) {
      const passphrase = bip39.generateMnemonic()
      const keys = crypto.getKeys(passphrase)
      const address = crypto.getAddress(keys.publicKey, config.publicKeyHash)

      wallets.push({ address, keys, passphrase })
  }

  return wallets
}
