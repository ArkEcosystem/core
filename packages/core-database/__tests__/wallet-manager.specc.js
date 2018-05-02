'use strict'

let walletManager
const { Block, Wallet } = require('@arkecosystem/client').models

const block = new Block(require('./__fixtures__/block.json')) // eslint-disable-line no-unused-vars

beforeAll(async (done) => {
  await require('./__support__/setup')()

  walletManager = new (require('../lib/wallet-manager'))()

  done()
})

function createWalletManager () {
  return new (require('../lib/wallet-manager'))()
}

describe('Wallet Manager', () => {
  it('should be an object', async () => {
    await expect(walletManager).toBeObject()
  })

  describe('reset', async () => {
    it('should be a function', async () => {
      await expect(walletManager.reset).toBeFunction()
    })

    it('empties the manager', () => {
      const wallet = new Wallet('dummy')
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(manager.getLocalWallets()).toEqual([wallet])

      manager.reset()
      expect(manager.getLocalWallets()).toEqual([])
    })
  })

  describe('reindex', async () => {
    it('should be a function', async () => {
      await expect(walletManager.reindex).toBeFunction()
    })

    it('indexes the wallet', () => {
      const wallet = new Wallet('blabl')
      const manager = createWalletManager()

      expect(manager.getLocalWallets()).toEqual([])

      manager.reindex(wallet)
      expect(manager.getLocalWallets()).toEqual([wallet])
    })
  })

  describe('applyBlock', async () => {
    it('should be a function', async () => {
      await expect(walletManager.applyBlock).toBeFunction()
    })

    it('applies all the transactions on the block', () => {

    })

    it('applies the block to the delegate', () => {

    })

    describe('if 1 transaction fails while applying it', () => {
      it('undoes all the transactions of the block', () => {

      })
    })

    describe('when the delegate of the block is not indexed', () => {
      describe('unless is the first block', () => {
        it('throw an Error', () => {

        })
      })

      describe('if it is the first block', () => {
        it('generates a new wallet', () => {

        })
      })
    })
  })

  describe('undoBlock', async () => {
    it('should be a function', async () => {
      await expect(walletManager.undoBlock).toBeFunction()
    })

    it('undoes all the transactions on the block', () => {

    })

    it('undoes the block to the delegate', () => {

    })
  })

  describe('applyTransaction', async () => {
    it('should be a function', async () => {
      await expect(walletManager.applyTransaction).toBeFunction()
    })

    it('applies all the transactions on the block', () => {

    })

    it('applies the block to the delegate', () => {

    })

    describe('if 1 transaction fails while applying it', () => {
      it('undoes all the transactions of the block', () => {

      })
    })

    describe('when the delegate of the block is not indexed', () => {
      describe('unless is the first block', () => {
        it('throw an Error', () => {

        })
      })

      describe('if it is the first block', () => {
        it('generates a new wallet', () => {

        })
      })
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

    it('should index it by address', () => {
      const wallet = new Wallet('dummy')
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(Object.keys(manager.walletsByAddress)[0]).toBe(wallet.address)
    })

    it('should return it by address', () => {
      const wallet = new Wallet('dummy')
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(manager.getWalletByAddress(wallet.address).address).toBe(wallet.address)
    })
  })

  describe('getWalletByPublicKey', async () => {
    it('should be a function', async () => {
      await expect(walletManager.getWalletByPublicKey).toBeFunction()
    })

    it('should index it by publicKey', () => {
      const wallet = new Wallet('dummy')
      wallet.publicKey = 'dummy-public-key'
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(Object.keys(manager.walletsByPublicKey)[0]).toBe(wallet.publicKey)
    })

    it('should return it by publicKey', () => {
      const wallet = new Wallet('dummy')
      wallet.publicKey = 'dummy-public-key'
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(manager.getWalletByPublicKey(wallet.publicKey).publicKey).toBe(wallet.publicKey)
    })
  })

  describe('getWalletByUsername', async () => {
    it('should be a function', async () => {
      await expect(walletManager.getWalletByUsername).toBeFunction()
    })

    it('should index it by username', () => {
      const wallet = new Wallet('dummy')
      wallet.username = 'dummy-username'
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(Object.keys(manager.walletsByUsername)[0]).toBe(wallet.username)
    })

    it('should return it by username', () => {
      const wallet = new Wallet('dummy')
      wallet.username = 'dummy-username'
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(manager.getWalletByUsername(wallet.username).username).toBe(wallet.username)
    })
  })

  describe('getLocalWallets', async () => {
    it('should be a function', async () => {
      await expect(walletManager.getLocalWallets).toBeFunction()
    })

    it('should return indexed', () => {
      const manager = createWalletManager()

      const wallet1 = new Wallet('dummy-1')
      manager.reindex(wallet1)

      const wallet2 = new Wallet('dummy-2')
      manager.reindex(wallet2)

      expect(manager.getLocalWallets()).toEqual([wallet1, wallet2])
    })
  })

  describe('__canBePurged', async () => {
    it('should be a function', async () => {
      await expect(walletManager.__canBePurged).toBeFunction()
    })
  })
})
