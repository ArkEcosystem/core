'use strict'

const app = require('./__support__/setup')

let walletManager
const { Block, Transaction, Wallet } = require('@arkecosystem/client').models
const { transactionBuilder } = require('@arkecosystem/client') // eslint-disable-line no-unused-vars

const block = new Block(require('./__fixtures__/block.json')) // eslint-disable-line no-unused-vars
const genesisBlock = require('./__fixtures__/genesisBlock.js') // eslint-disable-line no-unused-vars
const dummy1 = require('./__fixtures__/wallets.json')[0]
const dummy2 = require('./__fixtures__/wallets.json')[1]
const dummyFake = require('./__fixtures__/wallets.json')[2]

beforeAll(async (done) => {
  await app.setUp()

  walletManager = new (require('../lib/wallet-manager'))()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

function createWalletManager () {
  return new (require('../lib/wallet-manager'))()
}

describe('Wallet Manager', () => {
  it('should be an object', () => {
    expect(walletManager).toBeObject()
  })

  describe('reset', () => {
    it('should be a function', () => {
      expect(walletManager.reset).toBeFunction()
    })

    it('should reset the index', () => {
      const wallet = new Wallet(dummy1.address)
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(manager.getLocalWallets()).toEqual([wallet])

      manager.reset()
      expect(manager.getLocalWallets()).toEqual([])
    })
  })

  describe('reindex', () => {
    it('should be a function', () => {
      expect(walletManager.reindex).toBeFunction()
    })

    it('should index the wallets', () => {
      const wallet = new Wallet(dummy1.address)
      const manager = createWalletManager()

      expect(manager.getLocalWallets()).toEqual([])

      manager.reindex(wallet)
      expect(manager.getLocalWallets()).toEqual([wallet])
    })
  })

  describe('applyBlock', () => {
    let manager
    let delegateMock
    let block2

    const tx1 = transactionBuilder
      .vote()
      .create(['+036a520acf24036ff691a4f8ba19514828e9b5aa36ca4ba0452e9012023caccfef'])
      .sign(Math.random().toString(36))
    const tx2 = transactionBuilder
      .vote()
      .create(['-036a520acf24036ff691a4f8ba19514828e9b5aa36ca4ba0452e9012023caccfef'])
      .sign(Math.random().toString(36))

    beforeEach(() => {
      block2 = new Block(block.data)
      block2.transactions.push(block.transactions[0])
      block2.transactions.push(tx1)
      block2.transactions.push(tx2)

      manager = createWalletManager()

      delegateMock = { applyBlock: jest.fn() }
      manager.getWalletByPublicKey = jest.fn(() => delegateMock)
      manager.applyTransaction = jest.fn()
      manager.revertTransaction = jest.fn()
    })

    it('should be a function', () => {
      expect(walletManager.applyBlock).toBeFunction()
    })

    it('should apply sequentially the transactions of the block', async () => {
      await manager.applyBlock(block2)

      block2.transactions.forEach((transaction, i) => {
        expect(manager.applyTransaction.mock.calls[i][0]).toBe(block2.transactions[i])
      })
    })

    it('should apply the block data to the delegate', async () => {
      await manager.applyBlock(block)

      expect(delegateMock.applyBlock).toHaveBeenCalledWith(block.data)
    })

    describe('when 1 transaction fails while applying it', () => {
      it('should revert sequentially (from last to first) all the transactions of the block', async () => {
        manager.applyTransaction = jest.fn(transaction => {
          if (transaction === block2.transactions[2]) {
            throw new Error('Fake error')
          }
        })

        try {
          await manager.applyBlock(block2)
        } catch (_error) {
          block2.transactions.slice(0, 1).forEach((transaction, i) => {
            expect(manager.revertTransaction.mock.calls[1 - i][0]).toEqual(block2.transactions[i])
          })
        }
      })

      it('throws the Error', async () => {
        manager.applyTransaction = jest.fn(transaction => {
          throw new Error('Fake error')
        })

        try {
          await manager.applyBlock(block)
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toBe('Fake error')
        }
      })
    })

    xdescribe('the delegate of the block is not indexed', () => {
      describe('not genesis block', () => {
        it('throw an Error', () => {

        })
      })

      describe('genesis block', () => {
        it('generates a new wallet', () => {

        })
      })
    })
  })

  describe.skip('revertBlock', () => {
    it('should be a function', () => {
      expect(walletManager.revertBlock).toBeFunction()
    })

    it('should revert all transactions of the block', () => {
    })

    it('should revert the block of the delegate', () => {

    })
  })

  describe('applyTransaction', () => {
    it('should be a function', () => {
      expect(walletManager.applyTransaction).toBeFunction()
    })

    it('should apply the transaction to the sender & recipient', async () => {
      const transaction = new Transaction({
        type: 0,
        amount: 245098000000000,
        fee: 0,
        recipientId: 'AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri',
        timestamp: 0,
        asset: {},
        senderPublicKey: '035b63b4668ee261c16ca91443f3371e2fe349e131cb7bf5f8a3e93a3ddfdfc788',
        signature: '304402205fcb0677e06bde7aac3dc776665615f4b93ef8c3ed0fddecef9900e74fcb00f302206958a0c9868ea1b1f3d151bdfa92da1ce24de0b1fcd91933e64fb7971e92f48d',
        id: 'db1aa687737858cc9199bfa336f9b1c035915c30aaee60b1e0f8afadfdb946bd',
        senderId: 'APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn'
      })

      const manager = createWalletManager()

      const sender = manager.getWalletByPublicKey(transaction.data.senderPublicKey)
      sender.balance = transaction.data.amount
      const recipient = manager.getWalletByAddress(transaction.data.recipientId)

      expect(sender.balance).toBe(transaction.data.amount)
      expect(recipient.balance).toBe(0)

      await manager.applyTransaction(transaction)

      expect(sender.balance).toBe(0)
      expect(recipient.balance).toBe(transaction.data.amount)
    })
  })

  describe('revertTransaction', () => {
    it('should be a function', () => {
      expect(walletManager.revertTransaction).toBeFunction()
    })

    it('should revert the transaction from the sender & recipient', async () => {
      const transaction = new Transaction({
        type: 0,
        amount: 245098000000000,
        fee: 0,
        recipientId: 'AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri',
        timestamp: 0,
        asset: {},
        senderPublicKey: '035b63b4668ee261c16ca91443f3371e2fe349e131cb7bf5f8a3e93a3ddfdfc788',
        signature: '304402205fcb0677e06bde7aac3dc776665615f4b93ef8c3ed0fddecef9900e74fcb00f302206958a0c9868ea1b1f3d151bdfa92da1ce24de0b1fcd91933e64fb7971e92f48d',
        id: 'db1aa687737858cc9199bfa336f9b1c035915c30aaee60b1e0f8afadfdb946bd',
        senderId: 'APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn'
      })

      const manager = createWalletManager()

      const sender = manager.getWalletByPublicKey(transaction.data.senderPublicKey)
      const recipient = manager.getWalletByAddress(transaction.data.recipientId)
      recipient.balance = transaction.data.amount

      expect(sender.balance).toBe(0)
      expect(recipient.balance).toBe(transaction.data.amount)

      await manager.revertTransaction(transaction)

      expect(sender.balance).toBe(transaction.data.amount)
      expect(recipient.balance).toBe(0)
    })
  })

  describe('getWalletByAddress', () => {
    it('should be a function', () => {
      expect(walletManager.getWalletByAddress).toBeFunction()
    })

    it('should index it by address', () => {
      const wallet = new Wallet(dummy1.address)
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(Object.keys(manager.walletsByAddress)[0]).toBe(wallet.address)
    })

    it('should return it by address', () => {
      const wallet = new Wallet(dummy1.address)
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(manager.getWalletByAddress(wallet.address).address).toBe(wallet.address)
    })
  })

  describe('getWalletByPublicKey', () => {
    it('should be a function', () => {
      expect(walletManager.getWalletByPublicKey).toBeFunction()
    })

    it('should index it by publicKey', () => {
      const wallet = new Wallet(dummy1.address)
      wallet.publicKey = dummy1.publicKey
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(Object.keys(manager.walletsByPublicKey)[0]).toBe(wallet.publicKey)
    })

    it('should return it by publicKey', () => {
      const wallet = new Wallet(dummy1.address)
      wallet.publicKey = 'dummy-public-key'
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(manager.getWalletByPublicKey(wallet.publicKey).publicKey).toBe(wallet.publicKey)
    })
  })

  describe('getWalletByUsername', () => {
    it('should be a function', () => {
      expect(walletManager.getWalletByUsername).toBeFunction()
    })

    it('should index it by username', () => {
      const wallet = new Wallet(dummy1.address)
      wallet.username = 'dummy-username'
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(Object.keys(manager.walletsByUsername)[0]).toBe(wallet.username)
    })

    it('should return it by username', () => {
      const wallet = new Wallet(dummy1.address)
      wallet.username = 'dummy-username'
      const manager = createWalletManager()

      manager.reindex(wallet)
      expect(manager.getWalletByUsername(wallet.username).username).toBe(wallet.username)
    })
  })

  describe('getLocalWallets', () => {
    it('should be a function', () => {
      expect(walletManager.getLocalWallets).toBeFunction()
    })

    it('should return indexed', () => {
      const manager = createWalletManager()

      const wallet1 = new Wallet(dummy1.address)
      manager.reindex(wallet1)

      const wallet2 = new Wallet(dummy2.address)
      manager.reindex(wallet2)

      expect(manager.getLocalWallets()).toEqual([wallet1, wallet2])
    })
  })

  describe('__canBePurged', () => {
    it('should be removed if all criteria are satisfied', async () => {
      const wallet = new Wallet(dummy1.address)

      expect(createWalletManager().__canBePurged(wallet)).toBeTruthy()
    })

    it('should not be removed if wallet.secondPublicKey is set', async () => {
      const wallet = new Wallet(dummy1.address)
      wallet.secondPublicKey = 'secondPublicKey'

      expect(wallet.secondPublicKey).toBe('secondPublicKey')
      expect(createWalletManager().__canBePurged(wallet)).toBeFalsy()
    })

    it('should not be removed if wallet.multisignature is set', async () => {
      const wallet = new Wallet(dummy1.address)
      wallet.multisignature = 'multisignature'

      expect(wallet.multisignature).toBe('multisignature')
      expect(createWalletManager().__canBePurged(wallet)).toBeFalsy()
    })

    it('should not be removed if wallet.username is set', async () => {
      const wallet = new Wallet(dummy1.address)
      wallet.username = 'username'

      expect(wallet.username).toBe('username')
      expect(createWalletManager().__canBePurged(wallet)).toBeFalsy()
    })
  })

  describe('purgeEmptyNonDelegates', () => {
    it('should be a function', () => {
      expect(walletManager.purgeEmptyNonDelegates).toBeFunction()
    })

    it('should be purged if all criteria are satisfied', async () => {
      const manager = createWalletManager()

      const wallet1 = new Wallet(dummy1.address)
      wallet1.publicKey = 'dummy-1-publicKey'
      manager.reindex(wallet1)

      const wallet2 = new Wallet(dummy2.address)
      wallet2.username = 'username'

      manager.reindex(wallet2)

      manager.purgeEmptyNonDelegates()

      expect(manager.getLocalWallets()).toEqual([wallet2])
    })

    it('should not be purged if wallet.secondPublicKey is set', async () => {
      const manager = createWalletManager()

      const wallet1 = new Wallet(dummy1.address)
      wallet1.publicKey = 'dummy-1-publicKey'
      wallet1.secondPublicKey = 'dummy-1-secondPublicKey'
      manager.reindex(wallet1)

      const wallet2 = new Wallet(dummy2.address)
      wallet2.username = 'username'

      manager.reindex(wallet2)

      manager.purgeEmptyNonDelegates()

      expect(manager.getLocalWallets()).toEqual([wallet1, wallet2])
    })

    it('should not be purged if wallet.multisignature is set', async () => {
      const manager = createWalletManager()

      const wallet1 = new Wallet(dummy1.address)
      wallet1.publicKey = 'dummy-1-publicKey'
      wallet1.multisignature = 'dummy-1-multisignature'
      manager.reindex(wallet1)

      const wallet2 = new Wallet(dummy2.address)
      wallet2.username = 'username'

      manager.reindex(wallet2)

      manager.purgeEmptyNonDelegates()

      expect(manager.getLocalWallets()).toEqual([wallet1, wallet2])
    })

    it('should not be purged if wallet.username is set', async () => {
      const manager = createWalletManager()

      const wallet1 = new Wallet(dummy1.address)
      wallet1.publicKey = 'dummy-1-publicKey'
      wallet1.username = 'dummy-1-username'
      manager.reindex(wallet1)

      const wallet2 = new Wallet(dummy2.address)
      wallet2.username = 'username'

      manager.reindex(wallet2)

      manager.purgeEmptyNonDelegates()

      expect(manager.getLocalWallets()).toEqual([wallet1, wallet2])
    })
  })

  describe('isGenesis', () => {
    it('should be a function', () => {
      expect(walletManager.isGenesis).toBeFunction()
    })

    it('should be truthy', async () => {
      const wallet = new Wallet(dummy1.address)

      expect(createWalletManager().isGenesis(wallet)).toBeTruthy()
    })

    it('should be falsy', async () => {
      const wallet = new Wallet(dummyFake.address)

      expect(createWalletManager().isGenesis(wallet)).toBeFalsy()
    })
  })
})
