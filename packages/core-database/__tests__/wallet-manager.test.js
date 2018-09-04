'use strict'

const app = require('./__support__/setup')

const { Block, Transaction, Wallet } = require('@arkecosystem/crypto').models
const { transactionBuilder } = require('@arkecosystem/crypto')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants

const block = new Block(require('./__fixtures__/block.json')) // eslint-disable-line no-unused-vars
const walletData1 = require('./__fixtures__/wallets.json')[0]
const walletData2 = require('./__fixtures__/wallets.json')[1]
const walletDataFake = require('./__fixtures__/wallets.json')[2]

let genesisBlock // eslint-disable-line no-unused-vars
let walletManager

beforeAll(async (done) => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('./__fixtures__/genesisBlock')

  walletManager = new (require('../lib/wallet-manager'))()

  done()
})

beforeEach(() => {
  walletManager = new (require('../lib/wallet-manager'))()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Wallet Manager', () => {
  it('should be an object', () => {
    expect(walletManager).toBeObject()
  })

  describe('reset', () => {
    it('should be a function', () => {
      expect(walletManager.reset).toBeFunction()
    })

    it('should reset the index', () => {
      const wallet = new Wallet(walletData1.address)

      walletManager.reindex(wallet)
      expect(walletManager.all()).toEqual([wallet])

      walletManager.reset()
      expect(walletManager.all()).toEqual([])
    })
  })

  describe('reindex', () => {
    it('should be a function', () => {
      expect(walletManager.reindex).toBeFunction()
    })

    it('should index the wallets', () => {
      const wallet = new Wallet(walletData1.address)

      expect(walletManager.all()).toEqual([])

      walletManager.reindex(wallet)
      expect(walletManager.all()).toEqual([wallet])
    })
  })

  describe('applyBlock', () => {
    let delegateMock
    let block2

    const delegatePublicKey = '036a520acf24036ff691a4f8ba19514828e9b5aa36ca4ba0452e9012023caccfef'

    const txs = []
    for (let i = 0; i < 3; i++) {
      txs[i] = transactionBuilder
        .vote()
        .sign(Math.random().toString(36))
        .votesAsset([`+${delegatePublicKey}`])
        .build()
    }

    beforeEach(() => {
      delegateMock = { applyBlock: jest.fn(), publicKey: delegatePublicKey }
      walletManager.findByPublicKey = jest.fn(() => delegateMock)
      walletManager.applyTransaction = jest.fn()
      walletManager.revertTransaction = jest.fn()

      const { data } = block
      data.transactions = []
      data.transactions.push(txs[0])
      data.transactions.push(txs[1])
      data.transactions.push(txs[2])
      block2 = new Block(data)

      walletManager.reindex(delegateMock)
    })

    it('should be a function', () => {
      expect(walletManager.applyBlock).toBeFunction()
    })

    it('should apply sequentially the transactions of the block', async () => {
      await walletManager.applyBlock(block2)

      block2.transactions.forEach((transaction, i) => {
        expect(walletManager.applyTransaction.mock.calls[i][0]).toBe(block2.transactions[i])
      })
    })

    it('should apply the block data to the delegate', async () => {
      await walletManager.applyBlock(block)

      expect(delegateMock.applyBlock).toHaveBeenCalledWith(block.data)
    })

    describe('when 1 transaction fails while applying it', () => {
      it('should revert sequentially (from last to first) all the transactions of the block', async () => {
        walletManager.applyTransaction = jest.fn(transaction => {
          if (transaction === block2.transactions[2]) {
            throw new Error('Fake error')
          }
        })

        expect(block2.transactions.length).toBe(3)

        try {
          await walletManager.applyBlock(block2)

          expect(null).toBe('this should fail if no error is thrown')
        } catch (_error) {
          expect(walletManager.revertTransaction).toHaveBeenCalledTimes(2)
          block2.transactions.slice(0, 1).forEach((transaction, i) => {
            expect(walletManager.revertTransaction.mock.calls[1 - i][0]).toEqual(block2.transactions[i])
          })
        }
      })

      it('throws the Error', async () => {
        walletManager.applyTransaction = jest.fn(transaction => {
          throw new Error('Fake error')
        })

        try {
          await walletManager.applyBlock(block)

          expect(null).toBe('this should fail if no error is thrown')
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

    describe('when the recipient is a cold wallet', () => {
    })

    describe('when the transaction is a transfer', () => {
      const amount = 96579

      let sender
      let recipient
      let transaction

      beforeEach(() => {
        sender = new Wallet(walletData1.address)
        recipient = new Wallet(walletData2.address)
        recipient.publicKey = walletData2.publicKey

        // NOTE: the order is important: we sign a transaction with a random pass
        // to override the sender public key with a fake one

        transaction = transactionBuilder
          .transfer()
          .vendorField('dummy A transfer to dummy B')
          .sign(Math.random().toString(36))
          .recipientId(recipient.address)
          .amount(amount)
          .build()

        sender.publicKey = transaction.senderPublicKey

        walletManager.reindex(sender)
        walletManager.reindex(recipient)
      })

      it('should apply the transaction to the sender & recipient', async () => {
        const balance = 100000000
        sender.balance = balance

        expect(sender.balance).toBe(balance)
        expect(recipient.balance).toBe(0)

        await walletManager.applyTransaction(transaction)

        expect(sender.balance).toBe(balance - amount - transaction.fee)
        expect(recipient.balance).toBe(amount)
      })

      it('should fail if the transaction cannot be applied', async () => {
        const balance = 1
        sender.balance = balance

        expect(sender.balance).toBe(balance)
        expect(recipient.balance).toBe(0)

        try {
          expect(async () => {
            await walletManager.applyTransaction(transaction)
          }).toThrowError(/apply transaction/)

          expect(null).toBe('this should fail if no error is thrown')
        } catch (error) {
          expect(sender.balance).toBe(balance)
          expect(recipient.balance).toBe(0)
        }
      })
    })

    describe('when the transaction is a delegate registration', () => {
      const username = 'delegate_1'

      let sender
      let transaction

      beforeEach(() => {
        sender = new Wallet(walletData1.address)

        // NOTE: the order is important: we sign a transaction with a random pass
        // to override the sender public key with a fake one

        transaction = transactionBuilder
          .delegateRegistration()
          .usernameAsset(username)
          .sign(Math.random().toString(36))
          .build()

        sender.publicKey = transaction.senderPublicKey

        walletManager.reindex(sender)
      })

      it('should apply the transaction to the sender', async () => {
        const balance = 30 * Math.pow(10, 8)
        sender.balance = balance

        expect(sender.balance).toBe(balance)

        await walletManager.applyTransaction(transaction)

        expect(sender.balance).toBe(balance - transaction.fee)
        expect(sender.username).toBe(username)
        expect(walletManager.findByUsername(username)).toBe(sender)
      })

      it('should fail if the transaction cannot be applied', async () => {
        const balance = 1
        sender.balance = balance

        expect(sender.balance).toBe(balance)

        try {
          expect(async () => {
            await walletManager.applyTransaction(transaction)
          }).toThrowError(/apply transaction/)

          expect(null).toBe('this should fail if no error is thrown')
        } catch (error) {
          expect(sender.balance).toBe(balance)
        }
      })
    })

    describe('when the transaction is not a transfer', () => {
    })
  })

  describe('revertTransaction', () => {
    it('should be a function', () => {
      expect(walletManager.revertTransaction).toBeFunction()
    })

    it('should revert the transaction from the sender & recipient', async () => {
      const transaction = new Transaction({
        type: TRANSACTION_TYPES.TRANSFER,
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

      const sender = walletManager.findByPublicKey(transaction.data.senderPublicKey)
      const recipient = walletManager.findByAddress(transaction.data.recipientId)
      recipient.balance = transaction.data.amount

      expect(sender.balance).toBe(0)
      expect(recipient.balance).toBe(transaction.data.amount)

      await walletManager.revertTransaction(transaction)

      expect(sender.balance).toBe(transaction.data.amount)
      expect(recipient.balance).toBe(0)
    })
  })

  describe('findByAddress', () => {
    it('should be a function', () => {
      expect(walletManager.findByAddress).toBeFunction()
    })

    it('should index it by address', () => {
      const wallet = new Wallet(walletData1.address)

      walletManager.reindex(wallet)
      expect(walletManager.byAddress.get(wallet.address)).toBe(wallet)
    })

    it('should return it by address', () => {
      const wallet = new Wallet(walletData1.address)

      walletManager.reindex(wallet)
      expect(walletManager.findByAddress(wallet.address).address).toBe(wallet.address)
    })
  })

  describe('findByPublicKey', () => {
    it('should be a function', () => {
      expect(walletManager.findByPublicKey).toBeFunction()
    })

    it('should index it by publicKey', () => {
      const wallet = new Wallet(walletData1.address)
      wallet.publicKey = walletData1.publicKey

      walletManager.reindex(wallet)
      expect(walletManager.byPublicKey.get(wallet.publicKey)).toBe(wallet)
    })

    it('should return it by publicKey', () => {
      const wallet = new Wallet(walletData1.address)
      wallet.publicKey = 'dummy-public-key'

      walletManager.reindex(wallet)
      expect(walletManager.findByPublicKey(wallet.publicKey).publicKey).toBe(wallet.publicKey)
    })
  })

  describe('findByUsername', () => {
    it('should be a function', () => {
      expect(walletManager.findByUsername).toBeFunction()
    })

    it('should index it by username', () => {
      const wallet = new Wallet(walletData1.address)
      wallet.username = 'dummy-username'

      walletManager.reindex(wallet)
      expect(walletManager.byUsername.get(wallet.username)).toBe(wallet)
    })

    it('should return it by username', () => {
      const wallet = new Wallet(walletData1.address)
      wallet.username = 'dummy-username'

      walletManager.reindex(wallet)
      expect(walletManager.findByUsername(wallet.username).username).toBe(wallet.username)
    })
  })

  describe('all', () => {
    it('should be a function', () => {
      expect(walletManager.all).toBeFunction()
    })

    it('should return indexed', () => {
      const wallet1 = new Wallet(walletData1.address)
      walletManager.reindex(wallet1)

      const wallet2 = new Wallet(walletData2.address)
      walletManager.reindex(wallet2)

      expect(walletManager.all()).toEqual([wallet1, wallet2])
    })
  })

  describe('__canBePurged', () => {
    it('should be removed if all criteria are satisfied', async () => {
      const wallet = new Wallet(walletData1.address)

      expect(walletManager.__canBePurged(wallet)).toBeTruthy()
    })

    it('should not be removed if wallet.secondPublicKey is set', async () => {
      const wallet = new Wallet(walletData1.address)
      wallet.secondPublicKey = 'secondPublicKey'

      expect(wallet.secondPublicKey).toBe('secondPublicKey')
      expect(walletManager.__canBePurged(wallet)).toBeFalsy()
    })

    it('should not be removed if wallet.multisignature is set', async () => {
      const wallet = new Wallet(walletData1.address)
      wallet.multisignature = 'multisignature'

      expect(wallet.multisignature).toBe('multisignature')
      expect(walletManager.__canBePurged(wallet)).toBeFalsy()
    })

    it('should not be removed if wallet.username is set', async () => {
      const wallet = new Wallet(walletData1.address)
      wallet.username = 'username'

      expect(wallet.username).toBe('username')
      expect(walletManager.__canBePurged(wallet)).toBeFalsy()
    })
  })

  describe('purgeEmptyNonDelegates', () => {
    it('should be a function', () => {
      expect(walletManager.purgeEmptyNonDelegates).toBeFunction()
    })

    it('should be purged if all criteria are satisfied', async () => {
      const wallet1 = new Wallet(walletData1.address)
      wallet1.publicKey = 'dummy-1-publicKey'
      walletManager.reindex(wallet1)

      const wallet2 = new Wallet(walletData2.address)
      wallet2.username = 'username'

      walletManager.reindex(wallet2)

      walletManager.purgeEmptyNonDelegates()

      expect(walletManager.all()).toEqual([wallet2])
    })

    it('should not be purged if wallet.secondPublicKey is set', async () => {
      const wallet1 = new Wallet(walletData1.address)
      wallet1.publicKey = 'dummy-1-publicKey'
      wallet1.secondPublicKey = 'dummy-1-secondPublicKey'
      walletManager.reindex(wallet1)

      const wallet2 = new Wallet(walletData2.address)
      wallet2.username = 'username'

      walletManager.reindex(wallet2)

      walletManager.purgeEmptyNonDelegates()

      expect(walletManager.all()).toEqual([wallet1, wallet2])
    })

    it('should not be purged if wallet.multisignature is set', async () => {
      const wallet1 = new Wallet(walletData1.address)
      wallet1.publicKey = 'dummy-1-publicKey'
      wallet1.multisignature = 'dummy-1-multisignature'
      walletManager.reindex(wallet1)

      const wallet2 = new Wallet(walletData2.address)
      wallet2.username = 'username'

      walletManager.reindex(wallet2)

      walletManager.purgeEmptyNonDelegates()

      expect(walletManager.all()).toEqual([wallet1, wallet2])
    })

    it('should not be purged if wallet.username is set', async () => {
      const wallet1 = new Wallet(walletData1.address)
      wallet1.publicKey = 'dummy-1-publicKey'
      wallet1.username = 'dummy-1-username'
      walletManager.reindex(wallet1)

      const wallet2 = new Wallet(walletData2.address)
      wallet2.username = 'username'

      walletManager.reindex(wallet2)

      walletManager.purgeEmptyNonDelegates()

      expect(walletManager.all()).toEqual([wallet1, wallet2])
    })
  })

  describe('isGenesis', () => {
    it('should be a function', () => {
      expect(walletManager.isGenesis).toBeFunction()
    })

    it('should be truthy', async () => {
      const wallet = new Wallet(walletData1.address)

      expect(walletManager.isGenesis(wallet)).toBeTruthy()
    })

    it('should be falsy', async () => {
      const wallet = new Wallet(walletDataFake.address)

      expect(walletManager.isGenesis(wallet)).toBeFalsy()
    })
  })
})
