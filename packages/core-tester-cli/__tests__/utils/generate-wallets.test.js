'use strict'

const generateWallets = require('../../lib/utils/generate-wallets')
const arkjs = require('arkjs')

describe('Utils - Generate Wallets', () => {
  it('should be a function', () => {
    expect(generateWallets).toBeFunction()
  })

  it('should generate 4 wallets', () => {
    const wallets = generateWallets(4)

    expect(wallets.length).toBe(4)
  })

  it('should have wallet with passphrase, keys and address', () => {
    const wallet = generateWallets(1)[0]

    expect(wallet).toContainAllKeys([
      'address',
      'keys',
      'passphrase'
    ])
  })

  it('should give a wallet with a valid address', () => {
    const wallet = generateWallets(1)[0]

    expect(arkjs.crypto.validateAddress(wallet.address)).toBeTruthy()
  })

  it('should give a wallet with a valid passphrase', () => {
    const wallet = generateWallets(1)[0]
    const keys = arkjs.crypto.getKeys(wallet.passphrase)

    expect(keys).toContainKeys([
      'publicKey',
      'privateKey'
    ])
    expect(wallet.passphrase.split(' ').length).toBe(12)
    expect(arkjs.crypto.getAddress(keys.publicKey)).toBeTruthy()
  })
})
