const bip39 = require('bip39')
const { crypto } = require('arkjs')

module.exports = (quantity = 1) => {
  let wallets = []

  for (let i = 0; i < quantity; i++) {
      const passphrase = bip39.generateMnemonic()
      const address = crypto.getAddress(crypto.getKeys(passphrase).publicKey)

      wallets.push({ address, passphrase })
  }

  return wallets
}
