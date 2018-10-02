const bip39 = require('bip39')
const fs = require('fs')
const path = require('path')
const { crypto } = require('@arkecosystem/crypto')

module.exports = (quantity = 1, config) => {
  let wallets = []

  for (let i = 0; i < quantity; i++) {
    const passphrase = bip39.generateMnemonic()
    const keys = crypto.getKeys(passphrase)
    const address = crypto.getAddress(keys.publicKey, config.publicKeyHash)

    wallets.push({ address, keys, passphrase })
  }

  const testWalletsPath = path.resolve(__dirname, '../../test-wallets')
  for (const wallet of wallets) {
    fs.appendFileSync(testWalletsPath, `${wallet.address}: ${wallet.passphrase}\n`)
  }
  fs.appendFileSync(testWalletsPath, `${'-'.repeat(80)}\n`)

  return wallets
}
