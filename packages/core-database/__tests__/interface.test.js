'use strict'

const app = require('./__support__/setup')

const { Block, Transaction, Wallet } = require('@arkecosystem/crypto').models
const { Bignum, transactionBuilder } = require('@arkecosystem/crypto')
const { ARKTOSHI, TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants

let ConnectionInterface
let connectionInterface
let genesisBlock // eslint-disable-line no-unused-vars

beforeAll(async (done) => {
  await app.setUp()

  ConnectionInterface = require('../lib/interface')
  connectionInterface = new ConnectionInterface()
  genesisBlock = new Block(require('@arkecosystem/core-test-utils/config/testnet/genesisBlock.json'))

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Connection Interface', () => {
  it('should be an object', () => {
    expect(connectionInterface).toBeInstanceOf(ConnectionInterface)
  })

  describe('getConnection', () => {
    it('should be a function', () => {
      expect(connectionInterface.getConnection).toBeFunction()
    })

    it('should return the set connection', () => {
      connectionInterface.connection = 'fake-connection'

      expect(connectionInterface.getConnection()).toBe('fake-connection')
    })
  })

  describe('connect', () => {
    it('should be a function', () => {
      expect(connectionInterface.connect).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.connect()).rejects.toThrowError('Method [connect] not implemented!')
    })
  })

  describe('disconnect', () => {
    it('should be a function', () => {
      expect(connectionInterface.disconnect).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.disconnect()).rejects.toThrowError('Method [disconnect] not implemented!')
    })
  })

  describe('getActiveDelegates', () => {
    it('should be a function', () => {
      expect(connectionInterface.getActiveDelegates).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.getActiveDelegates()).rejects.toThrowError('Method [getActiveDelegates] not implemented!')
    })
  })

  describe('buildWallets', () => {
    it('should be a function', () => {
      expect(connectionInterface.buildWallets).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.buildWallets()).rejects.toThrowError('Method [buildWallets] not implemented!')
    })
  })

  describe('saveWallets', () => {
    it('should be a function', () => {
      expect(connectionInterface.saveWallets).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.saveWallets()).rejects.toThrowError('Method [saveWallets] not implemented!')
    })
  })

  describe('saveBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.saveBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.saveBlock()).rejects.toThrowError('Method [saveBlock] not implemented!')
    })
  })

  describe('enqueueSaveBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.enqueueSaveBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(connectionInterface.enqueueSaveBlock).toThrowError('Method [enqueueSaveBlock] not implemented!')
    })
  })

  describe('enqueueDeleteBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.enqueueDeleteBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(connectionInterface.enqueueDeleteBlock).toThrowError('Method [enqueueDeleteBlock] not implemented!')
    })
  })

  describe('enqueueDeleteRound', () => {
    it('should be a function', () => {
      expect(connectionInterface.enqueueDeleteRound).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(connectionInterface.enqueueDeleteRound).toThrowError('Method [enqueueDeleteRound] not implemented!')
    })
  })

  describe('commitQueuedQueries', () => {
    it('should be a function', () => {
      expect(connectionInterface.commitQueuedQueries).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.commitQueuedQueries()).rejects.toThrowError('Method [commitQueuedQueries] not implemented!')
    })
  })

  describe('deleteBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.deleteBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.deleteBlock()).rejects.toThrowError('Method [deleteBlock] not implemented!')
    })
  })

  describe('getBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.getBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.getBlock()).rejects.toThrowError('Method [getBlock] not implemented!')
    })
  })

  describe('getLastBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.getLastBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.getLastBlock()).rejects.toThrowError('Method [getLastBlock] not implemented!')
    })
  })

  describe('getBlocks', () => {
    it('should be a function', () => {
      expect(connectionInterface.getBlocks).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.getBlocks()).rejects.toThrowError('Method [getBlocks] not implemented!')
    })
  })

  describe('getRecentBlockIds', () => {
    it('should be a function', () => {
      expect(connectionInterface.getRecentBlockIds).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.getRecentBlockIds()).rejects.toThrowError('Method [getRecentBlockIds] not implemented!')
    })

    xit('should return an array', async () => {
      connectionInterface.recentBlockIds = ['10']
      const blockIds = await connectionInterface.getRecentBlockIds()

      expect(blockIds).toBeArray()
      expect(blockIds).toIncludeAllMembers(['10'])
    })
  })

  describe('saveRound', () => {
    it('should be a function', () => {
      expect(connectionInterface.saveRound).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.saveRound()).rejects.toThrowError('Method [saveRound] not implemented!')
    })
  })

  describe('deleteRound', () => {
    it('should be a function', () => {
      expect(connectionInterface.deleteRound).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.deleteRound()).rejects.toThrowError('Method [deleteRound] not implemented!')
    })
  })

  describe('updateDelegateStats', () => {
    it('should be a function', () => {
      expect(connectionInterface.updateDelegateStats).toBeFunction()
    })
  })

  describe.skip('applyRound', () => {
    it('should be a function', () => {
      expect(connectionInterface.applyRound).toBeFunction()
    })
  })

  describe.skip('revertRound', () => {
    it('should be a function', () => {
      expect(connectionInterface.revertRound).toBeFunction()
    })
  })

  describe.skip('validateDelegate', () => {
    it('should be a function', () => {
      expect(connectionInterface.validateDelegate).toBeFunction()
    })
  })

  describe.skip('validateForkedBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.validateForkedBlock).toBeFunction()
    })
  })

  describe.skip('applyBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.applyBlock).toBeFunction()
    })
  })

  describe.skip('revertBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.revertBlock).toBeFunction()
    })
  })

  describe.skip('verifyTransaction', () => {
    it('should be a function', () => {
      expect(connectionInterface.verifyTransaction).toBeFunction()
    })
  })

  describe.skip('applyTransaction', () => {
    it('should be a function', () => {
      expect(connectionInterface.applyTransaction).toBeFunction()
    })
  })

  describe.skip('revertTransaction', () => {
    it('should be a function', () => {
      expect(connectionInterface.revertTransaction).toBeFunction()
    })
  })

  describe.skip('snapshot', () => {
    it('should be a function', () => {
      expect(connectionInterface.snapshot).toBeFunction()
    })
  })

  describe('__calcPreviousActiveDelegates', () => {
    it('should be a function', () => {
      expect(connectionInterface.__calcPreviousActiveDelegates).toBeFunction()
    })

    it('should calculate the previous delegate list', async () => {
      const walletManager = new (require('../lib/wallet-manager'))()
      const initialHeight = 52

      // Create delegates
      for (const transaction of genesisBlock.transactions) {
        if (transaction.type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
          const wallet = walletManager.findByPublicKey(transaction.senderPublicKey)
          wallet.username = Transaction.deserialize(transaction.serialized.toString('hex')).asset.delegate.username
          walletManager.reindex(wallet)
        }
      }

      const keys = {
        passphrase: 'this is a secret passphrase',
        publicKey: '02c71ab1a1b5b7c278145382eb0b535249483b3c4715a4fe6169d40388bbb09fa7',
        privateKey: 'dcf4ead2355090279aefba91540f32e93b15c541ecb48ca73071f161b4f3e2e3',
        address: 'D64cbDctaiADEH7NREnvRQGV27bnb1v2kE'
      }

      // Beginning of round 2 with all delegates 0 vote balance.
      const delegatesRound2 = walletManager.loadActiveDelegateList(51, initialHeight)

      // Prepare sender wallet
      const sender = new Wallet(keys.address)
      sender.publicKey = keys.publicKey
      sender.canApply = jest.fn(() => true)
      walletManager.reindex(sender)

      // Apply 51 blocks, where each increases the vote balance of a delegate to
      // reverse the current delegate order.
      const blocksInRound = []
      for (let i = 0; i < 51; i++) {
        const transfer = transactionBuilder
          .transfer()
          .amount(i * ARKTOSHI)
          .recipientId(delegatesRound2[i].address)
          .sign(keys.passphrase)
          .build()

        // Vote for itself
        walletManager.byPublicKey[delegatesRound2[i].publicKey].vote = delegatesRound2[i].publicKey

        const block = Block.create({
          version: 0,
          timestamp: 0,
          height: initialHeight + i,
          numberOfTransactions: 0,
          totalAmount: transfer.amount,
          totalFee: new Bignum(0.1),
          reward: new Bignum(2),
          payloadLength: 32 * 0,
          payloadHash: '',
          transactions: [transfer]
        }, keys)

        block.data.generatorPublicKey = keys.publicKey
        walletManager.applyBlock(block)

        blocksInRound.push(block)
      }

      // The delegates from round 2 are now reversed in rank in round 3.
      const delegatesRound3 = walletManager.loadActiveDelegateList(51, initialHeight + 51)
      for (let i = 0; i < delegatesRound3.length; i++) {
        expect(delegatesRound3[i].rate).toBe(i + 1)
        expect(delegatesRound3[i].publicKey).toBe(delegatesRound2[delegatesRound3.length - i - 1].publicKey)
      }

      const connection = new ConnectionInterface()
      connection.__getBlocksForRound = jest.fn(async () => blocksInRound)
      connection.walletManager = walletManager

      // Necessary for revertRound to not blow up.
      walletManager.allByUsername = jest.fn(() => {
        const usernames = Object.values(walletManager.byUsername)
        usernames.push(sender)
        return usernames
      })

      // Finally recalculate the round 2 list and compare against the original list
      const restoredDelegatesRound2 = await connection.__calcPreviousActiveDelegates(2)

      for (let i = 0; i < restoredDelegatesRound2.length; i++) {
        expect(restoredDelegatesRound2[i].rate).toBe(i + 1)
        expect(restoredDelegatesRound2[i].publicKey).toBe(delegatesRound2[i].publicKey)
      }
    })
  })

  describe('_registerWalletManager', () => {
    it('should be a function', () => {
      expect(connectionInterface._registerWalletManager).toBeFunction()
    })

    it('should register the wallet manager', () => {
      expect(connectionInterface).not.toHaveProperty('walletManager')

      connectionInterface._registerWalletManager()

      expect(connectionInterface).toHaveProperty('walletManager')
    })
  })

  describe('_registerRepositories', () => {
    it('should be a function', () => {
      expect(connectionInterface._registerRepositories).toBeFunction()
    })

    it('should register the repositories', async () => {
      await expect(connectionInterface).not.toHaveProperty('wallets')
      await expect(connectionInterface).not.toHaveProperty('delegates')

      connectionInterface._registerRepositories()

      await expect(connectionInterface).toHaveProperty('wallets')
      await expect(connectionInterface.wallets).toBeInstanceOf(require('../lib/repositories/wallets'))

      await expect(connectionInterface).toHaveProperty('delegates')
      await expect(connectionInterface.delegates).toBeInstanceOf(require('../lib/repositories/delegates'))
    })
  })
})
