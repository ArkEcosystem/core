'use strict'

const app = require('./__support__/setup')
const generateRound = require('./__support__/utils/generate-round')
const activeDelegates = require('./__fixtures__/delegates.json')

const { Block } = require('@arkecosystem/client').models

const genesisBlock = new Block(require('./__fixtures__/genesisBlock.json'))

let connection

async function createConnection () {
  const sequelize = new (require('../lib/connection'))({
    dialect: 'sqlite',
    storage: ':memory:'
  })

  connection = await sequelize.make()
}

beforeAll(async (done) => {
  await app.setUp()

  await createConnection()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(async (done) => {
  connection.disconnect()

  await createConnection()

  done()
})

describe('Sequelize Connection', () => {
  it('should be an object', async () => {
    await expect(connection).toBeObject()
  })

  describe('make', async () => {
    it('should be a function', async () => {
      await expect(connection.make).toBeFunction()
    })

    it('should instantiate sequelize', async () => {
      const connection = new (require('../lib/connection'))({
        dialect: 'sqlite',
        storage: ':memory:'
      })

      await connection.make()

      await expect(connection.connection).toBeInstanceOf(require('sequelize'))
    })
  })

  describe('getActiveDelegates', async () => {
    it('should be a function', async () => {
      await expect(connection.getActiveDelegates).toBeFunction()
    })

    it('should return active delegates', async () => {
      await connection.saveRound(generateRound(activeDelegates, 1))

      const delegates = await connection.getActiveDelegates(1)

      await expect(delegates).toBeArray()
      await expect(delegates).toHaveLength(51)
      await expect(delegates[0]).toBeObject()
      await expect(delegates[0]).toHaveProperty('id')
      await expect(delegates[0]).toHaveProperty('round')
      await expect(delegates[0]).toHaveProperty('publicKey')
      await expect(delegates[0]).toHaveProperty('balance')
    })
  })

  describe('saveRound', async () => {
    it('should be a function', async () => {
      await expect(connection.saveRound).toBeFunction()
    })

    it('should save round to the database', async () => {
      const round = await connection.saveRound(generateRound(activeDelegates, 1))
      await expect(round).toBeArray()
      await expect(round[0]).toBeObject()
      await expect(round[0].publicKey).toBe(activeDelegates[0])
    })
  })

  describe('deleteRound', async () => {
    it('should be a function', async () => {
      await expect(connection.deleteRound).toBeFunction()
    })

    it('should remove round from the database', async () => {
      const round = await connection.saveRound(generateRound(activeDelegates, 1))
      await expect(round).toBeArray()

      const before = await connection.models.round.findAndCountAll()
      await expect(before.count).toBe(51)

      await connection.deleteRound(1)

      const after = await connection.models.round.findAndCountAll()
      await expect(after.count).toBe(0)
    })
  })

  describe('buildDelegates', async () => {
    it('should be a function', async () => {
      await expect(connection.buildDelegates).toBeFunction()
    })

    it('should return a list of delegates', async () => {
      await connection.saveBlock(genesisBlock)

      const wallets = await connection.buildWallets(1)
      await connection.saveWallets(true)

      const delegates = await connection.buildDelegates(51, 1)

      await expect(delegates).toHaveLength(51)
    })
  })

  describe('buildWallets', async () => {
    it('should be a function', async () => {
      await expect(connection.buildWallets).toBeFunction()
    })

    it('should return a list of wallets', async () => {
      await connection.saveBlock(genesisBlock)

      const wallets = await connection.buildWallets(1)

      await expect(Object.keys(wallets)).toHaveLength(53)
    })
  })

  describe('updateDelegateStats', async () => {
    it('should be a function', async () => {
      await expect(connection.updateDelegateStats).toBeFunction()
    })

    it('should update the delegate', async () => {
      await connection.saveBlock(genesisBlock)

      const wallets = await connection.buildWallets(1)
      await connection.saveWallets(true)

      const delegates = await connection.buildDelegates(51, 1)

      const wallet = connection.walletManager.getWalletByPublicKey('03e59140fde881ac437ec3dc3e372bf25f7c19f0b471a5b35cc30f783e8a7b811b')
      await expect(wallet.missedBlocks).toBe(0)

      await connection.updateDelegateStats(genesisBlock, delegates)

      await expect(wallet.missedBlocks).toBe(1)
    })
  })

  describe('saveWallets', async () => {
    it('should be a function', async () => {
      await expect(connection.saveWallets).toBeFunction()
    })

    it('should save the wallets', async () => {
      await connection.saveBlock(genesisBlock)

      const wallets = await connection.buildWallets(1)
      await connection.saveWallets(true)

      const walletCount = await connection.models.wallet.count()
      await expect(walletCount).toBe(53)
    })
  })

  describe('saveBlock', async () => {
    it('should be a function', async () => {
      await expect(connection.saveBlock).toBeFunction()
    })

    it('should save the block and transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const blockCount = await connection.models.block.count()
      await expect(blockCount).toBe(1)

      const transactionCount = await connection.models.transaction.count()
      await expect(transactionCount).toBe(153)
    })
  })

  describe('saveBlockAsync', async () => {
    it('should be a function', async () => {
      await expect(connection.saveBlockAsync).toBeFunction()
    })

    it('should save the block and transactions', async () => {
      await connection.saveBlockAsync(genesisBlock)

      const blockCount = await connection.models.block.count()
      await expect(blockCount).toBe(1)

      const transactionCount = await connection.models.transaction.count()
      await expect(transactionCount).toBe(153)
    })
  })

  describe('saveBlockCommit', async () => {
    it('should be a function', async () => {
      await expect(connection.saveBlockCommit).toBeFunction()
    })

    it('should save the block and transactions', async () => {
      await connection.saveBlockAsync(genesisBlock)
      await connection.saveBlockCommit()

      const blockCount = await connection.models.block.count()
      await expect(blockCount).toBe(1)

      const transactionCount = await connection.models.transaction.count()
      await expect(transactionCount).toBe(153)
    })
  })

  describe('deleteBlock', async () => {
    it('should be a function', async () => {
      await expect(connection.deleteBlock).toBeFunction()
    })

    it('should remove the block and transactions', async () => {
      await connection.saveBlock(genesisBlock)

      let blockCount = await connection.models.block.count()
      await expect(blockCount).toBe(1)

      let transactionCount = await connection.models.transaction.count()
      await expect(transactionCount).toBe(153)

      await connection.deleteBlock(genesisBlock)

      blockCount = await connection.models.block.count()
      await expect(blockCount).toBe(0)

      transactionCount = await connection.models.transaction.count()
      await expect(transactionCount).toBe(0)
    })
  })

  describe('getBlock', async () => {
    it('should be a function', async () => {
      await expect(connection.getBlock).toBeFunction()
    })

    it('should get the block and transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const block = await connection.getBlock(genesisBlock.data.id)
      await expect(block).toBeObject()
      await expect(block.data.id).toBe(genesisBlock.data.id)
    })
  })

  describe('getTransaction', async () => {
    it('should be a function', async () => {
      await expect(connection.getTransaction).toBeFunction()
    })

    it('should get the transaction', async () => {
      const genesisTransaction = genesisBlock.transactions[0].id

      await connection.saveBlock(genesisBlock)

      const transaction = await connection.getTransaction(genesisTransaction)
      await expect(transaction).toBeObject()
      await expect(transaction.id).toBe(genesisTransaction)
    })
  })

  describe('getCommonBlock', async () => {
    it('should be a function', async () => {
      await expect(connection.getCommonBlock).toBeFunction()
    })

    it('should get the common block', async () => {
      await connection.saveBlock(genesisBlock)

      const blocks = await connection.getCommonBlock([genesisBlock.data.id])

      await expect(blocks).toBeObject()
      await expect(blocks[0].id).toBe(genesisBlock.data.id)
    })
  })

  describe('getTransactionsFromIds', async () => {
    it('should be a function', async () => {
      await expect(connection.getTransactionsFromIds).toBeFunction()
    })

    it('should get the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await connection.getTransactionsFromIds([
        'db1aa687737858cc9199bfa336f9b1c035915c30aaee60b1e0f8afadfdb946bd',
        '0762007f825f02979a883396839d6f7425d5ab18f4b8c266bebe60212c793c6d',
        '3c39aca95ad807ce19c0325e3059d7b1cf967751c6929035214a4ef320fb8154'
      ])

      await expect(transactions).toBeObject()
      await expect(transactions[0].id).toBe('db1aa687737858cc9199bfa336f9b1c035915c30aaee60b1e0f8afadfdb946bd')
      await expect(transactions[1].id).toBe('0762007f825f02979a883396839d6f7425d5ab18f4b8c266bebe60212c793c6d')
      await expect(transactions[2].id).toBe('3c39aca95ad807ce19c0325e3059d7b1cf967751c6929035214a4ef320fb8154')
    })
  })

  describe('getForgedTransactionsIds', async () => {
    it('should be a function', async () => {
      await expect(connection.getForgedTransactionsIds).toBeFunction()
    })

    it('should get the transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await connection.getForgedTransactionsIds([
        'db1aa687737858cc9199bfa336f9b1c035915c30aaee60b1e0f8afadfdb946bd',
        '0762007f825f02979a883396839d6f7425d5ab18f4b8c266bebe60212c793c6d',
        '3c39aca95ad807ce19c0325e3059d7b1cf967751c6929035214a4ef320fb8154'
      ])

      await expect(transactions).toBeObject()
      await expect(transactions[0]).toBe('0762007f825f02979a883396839d6f7425d5ab18f4b8c266bebe60212c793c6d')
      await expect(transactions[1]).toBe('3c39aca95ad807ce19c0325e3059d7b1cf967751c6929035214a4ef320fb8154')
      await expect(transactions[2]).toBe('db1aa687737858cc9199bfa336f9b1c035915c30aaee60b1e0f8afadfdb946bd')
    })
  })

  describe('getLastBlock', async () => {
    it('should be a function', async () => {
      await expect(connection.getLastBlock).toBeFunction()
    })

    it('should get the last block', async () => {
      await connection.saveBlock(genesisBlock)

      const block = await connection.getLastBlock()

      await expect(block).toBeObject()
      await expect(block.data.id).toBe(genesisBlock.data.id)
    })
  })

  describe('getBlocks', async () => {
    it('should be a function', async () => {
      await expect(connection.getBlocks).toBeFunction()
    })

    it('should get the blocks', async () => {
      await connection.saveBlock(genesisBlock)

      const blocks = await connection.getBlocks(0, 1)

      await expect(blocks).toBeObject()
      await expect(blocks[0].id).toBe(genesisBlock.data.id)
    })
  })

  describe('getBlockHeaders', async () => {
    it('should be a function', async () => {
      await expect(connection.getBlockHeaders).toBeFunction()
    })

    it('should get the block headers', async () => {
      await connection.saveBlock(genesisBlock)

      const blocks = await connection.getBlockHeaders(0, 1)

      await expect(blocks).toBeObject()
      await expect(blocks[0]).toBeInstanceOf(Buffer)
    })
  })
})
