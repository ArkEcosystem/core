'use strict'

const generateWallet = require('../../lib/utils/generate-wallet')
const arkjs = require('arkjs')

describe('generateWallet', () => {
  it('should be a function', () => {
    expect(generateWallet).toBeFunction()
  })

  it('should generate 4 wallets', () => {
    const wallets = generateWallet(4)

    expect(wallets.length).toBe(4)
  })

  it('should have wallet with passphrase and address', () => {
    const wallet = generateWallet(1)[0]

    expect(wallet).toContainAllKeys([
      'address',
      'passphrase'
    ])
  })

  it('should give a wallet with a valid address', () => {
    const wallet = generateWallet(1)[0]

    expect(arkjs.crypto.validateAddress(wallet.address)).toBeTruthy()
  })

  it('should give a wallet with a valid passphrase', () => {
    const wallet = generateWallet(1)[0]
    const keys = arkjs.crypto.getKeys(wallet.passphrase)

    expect(keys).toContainKeys([
      'publicKey',
      'privateKey'
    ])
    expect(wallet.passphrase.split(' ').length).toBe(12)
    expect(arkjs.crypto.getAddress(keys.publicKey)).toBeTruthy()
  })
})
