'use strict';

const walletManager = require('../lib/wallet-manager')

describe('Wallet Manager', () => {
  it('should be an object', async () => {
    await expect(walletManager).toBeObject()
  })

  describe('init', async () => {
    it('should be a function', async () => {
      await expect(walletManager.init).toBeFunction()
    })
  })
})
