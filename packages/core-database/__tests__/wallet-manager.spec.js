'use strict'

let walletManager

beforeAll(async (done) => {
  await require('./__support__/setup')()

  walletManager = new (require('../lib/wallet-manager'))()

  done()
})

describe('Wallet Manager', () => {
  it('should be an object', async () => {
    await expect(walletManager).toBeObject()
  })

  describe('reset', async () => {
    it('should be a function', async () => {
      await expect(walletManager.reset).toBeFunction()
    })
  })

  describe('reindex', async () => {
    it('should be a function', async () => {
      await expect(walletManager.reindex).toBeFunction()
    })
  })

  describe('applyBlock', async () => {
    it('should be a function', async () => {
      await expect(walletManager.applyBlock).toBeFunction()
    })
  })

  describe('undoBlock', async () => {
    it('should be a function', async () => {
      await expect(walletManager.undoBlock).toBeFunction()
    })
  })

  describe('applyTransaction', async () => {
    it('should be a function', async () => {
      await expect(walletManager.applyTransaction).toBeFunction()
    })
  })

  describe('undoTransaction', async () => {
    it('should be a function', async () => {
      await expect(walletManager.undoTransaction).toBeFunction()
    })
  })

  describe('getWalletByAddress', async () => {
    it('should be a function', async () => {
      await expect(walletManager.getWalletByAddress).toBeFunction()
    })
  })

  describe('getWalletByPublicKey', async () => {
    it('should be a function', async () => {
      await expect(walletManager.getWalletByPublicKey).toBeFunction()
    })
  })

  describe('getDelegate', async () => {
    it('should be a function', async () => {
      await expect(walletManager.getDelegate).toBeFunction()
    })
  })

  describe('getLocalWallets', async () => {
    it('should be a function', async () => {
      await expect(walletManager.getLocalWallets).toBeFunction()
    })
  })
})
