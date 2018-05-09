'use strict'

const app = require('./__support__/setup')
const generateRound = require('./__support__/utils/generate-round')
const activeDelegates = require('./__fixtures__/delegates.json')

const { Block } = require('@arkecosystem/client').models

const genesisBlock = new Block(require('./__fixtures__/genesisBlock.json'))

let readConnection
let writeConnection

async function createReadConnection () {
  const connection = new (require('../lib/connection'))({
    dialect: 'postgres',
    uri: 'postgres://node:password@localhost:5432/ark_testnet'
  })

  readConnection = await connection.make()
}

async function createWriteConnection () {
  const connection = new (require('../lib/connection'))({
    dialect: 'sqlite',
    storage: ':memory:'
  })

  writeConnection = await connection.make()
}

beforeAll(async (done) => {
  await app.setUp()

  await createReadConnection()
  await createWriteConnection()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(async (done) => {
  readConnection.disconnect()
  writeConnection.disconnect()

  await createReadConnection()
  await createWriteConnection()

  done()
})

describe('Sequelize Connection', () => {
  it('should be an object', async () => {
    await expect(writeConnection).toBeObject()
  })

  // describe('make', async () => {
  //   it('should be a function', async () => {
  //     await expect(writeConnection.make).toBeFunction()
  //   })
  // })

  // describe('connect', async () => {
  //   it('should be a function', async () => {
  //     await expect(writeConnection.connect).toBeFunction()
  //   })
  // })

  // describe('disconnect', async () => {
  //   it('should be a function', async () => {
  //     await expect(writeConnection.disconnect).toBeFunction()
  //   })
  // })

  describe('getActiveDelegates', async () => {
    it('should be a function', async () => {
      await expect(readConnection.getActiveDelegates).toBeFunction()
    })

    it('should return active delegates', async () => {
      const delegates = await readConnection.getActiveDelegates(1)

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
      await expect(writeConnection.saveRound).toBeFunction()
    })

    it('should save round to the database', async () => {
      const round = await writeConnection.saveRound(generateRound(activeDelegates, 1))
      await expect(round).toBeArray()
      await expect(round[0]).toBeObject()
      await expect(round[0].publicKey).toBe(activeDelegates[0])
    })
  })

  describe('deleteRound', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.deleteRound).toBeFunction()
    })

    it('should remove round from the database', async () => {
      const round = await writeConnection.saveRound(generateRound(activeDelegates, 1))
      await expect(round).toBeArray()

      const before = await writeConnection.models.round.findAndCountAll()
      await expect(before.count).toBe(51)

      await writeConnection.deleteRound(1)

      const after = await writeConnection.models.round.findAndCountAll()
      await expect(after.count).toBe(0)
    })
  })

  // describe('buildDelegates', async () => {
  //   it('should be a function', async () => {
  //     await expect(writeConnection.buildDelegates).toBeFunction()
  //   })
  // })

  describe('buildWallets', async () => {
    it('should be a function', async () => {
      await expect(readConnection.buildWallets).toBeFunction()
    })

    it('should return a list of wallets', async () => {
      const wallets = await readConnection.buildWallets(1)

      await expect(Object.keys(wallets)).not.toBeEmpty()
    })
  })

  // describe('updateDelegateStats', async () => {
  //   it('should be a function', async () => {
  //     await expect(writeConnection.updateDelegateStats).toBeFunction()
  //   })
  // })

  // describe('saveWallets', async () => {
  //   it('should be a function', async () => {
  //     await expect(writeConnection.saveWallets).toBeFunction()
  //   })
  // })

  describe('saveBlock', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.saveBlock).toBeFunction()
    })

    it('should save the block and transactions', async () => {
      await writeConnection.saveBlock(genesisBlock)

      const blockCount = await writeConnection.models.block.count()
      await expect(blockCount).toBe(1)

      const transactionCount = await writeConnection.models.transaction.count()
      await expect(transactionCount).toBe(153)
    })
  })

  describe('saveBlockAsync', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.saveBlockAsync).toBeFunction()
    })

    it('should save the block and transactions', async () => {
      await writeConnection.saveBlockAsync(genesisBlock)

      const blockCount = await writeConnection.models.block.count()
      await expect(blockCount).toBe(1)

      const transactionCount = await writeConnection.models.transaction.count()
      await expect(transactionCount).toBe(153)
    })
  })

  describe('saveBlockCommit', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.saveBlockCommit).toBeFunction()
    })

    it('should save the block and transactions', async () => {
      await writeConnection.saveBlockAsync(genesisBlock)
      await writeConnection.saveBlockCommit()

      const blockCount = await writeConnection.models.block.count()
      await expect(blockCount).toBe(1)

      const transactionCount = await writeConnection.models.transaction.count()
      await expect(transactionCount).toBe(153)
    })
  })

  describe('deleteBlock', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.deleteBlock).toBeFunction()
    })

    it('should remove the block and transactions', async () => {
      await writeConnection.saveBlock(genesisBlock)

      let blockCount = await writeConnection.models.block.count()
      await expect(blockCount).toBe(1)

      let transactionCount = await writeConnection.models.transaction.count()
      await expect(transactionCount).toBe(153)

      await writeConnection.deleteBlock(genesisBlock)

      blockCount = await writeConnection.models.block.count()
      await expect(blockCount).toBe(0)

      transactionCount = await writeConnection.models.transaction.count()
      await expect(transactionCount).toBe(0)
    })
  })

  describe('getBlock', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.getBlock).toBeFunction()
    })

    it('should get the block and transactions', async () => {
      await writeConnection.saveBlock(genesisBlock)

      const block = await writeConnection.getBlock(genesisBlock.data.id)
      await expect(block).toBeObject()
      await expect(block.data.id).toBe(genesisBlock.data.id)
    })
  })

  describe('getTransaction', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.getTransaction).toBeFunction()
    })

    it('should get the transaction', async () => {
      const genesisTransaction = genesisBlock.transactions[0].id

      await writeConnection.saveBlock(genesisBlock)

      const transaction = await writeConnection.getTransaction(genesisTransaction)
      await expect(transaction).toBeObject()
      await expect(transaction.id).toBe(genesisTransaction)
    })
  })

  describe('getCommonBlock', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.getCommonBlock).toBeFunction()
    })

    it('should get the common block', async () => {
      await writeConnection.saveBlock(genesisBlock)

      const blocks = await writeConnection.getCommonBlock([genesisBlock.data.id])

      await expect(blocks).toBeObject()
      await expect(blocks[0].id).toBe(genesisBlock.data.id)
    })
  })

  describe('getTransactionsFromIds', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.getTransactionsFromIds).toBeFunction()
    })

    it('should get the transactions', async () => {
      await writeConnection.saveBlock(genesisBlock)

      const transactions = await writeConnection.getTransactionsFromIds([
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
      await expect(writeConnection.getForgedTransactionsIds).toBeFunction()
    })

    it('should get the transactions', async () => {
      await writeConnection.saveBlock(genesisBlock)

      const transactions = await writeConnection.getForgedTransactionsIds([
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
      await expect(writeConnection.getLastBlock).toBeFunction()
    })

    it('should get the last block', async () => {
      await writeConnection.saveBlock(genesisBlock)

      const block = await writeConnection.getLastBlock()

      await expect(block).toBeObject()
      await expect(block.data.id).toBe(genesisBlock.data.id)
    })
  })

  describe('getBlocks', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.getBlocks).toBeFunction()
    })

    it('should get the blocks', async () => {
      await writeConnection.saveBlock(genesisBlock)

      const blocks = await writeConnection.getBlocks(0, 1)

      await expect(blocks).toBeObject()
      await expect(blocks[0].id).toBe(genesisBlock.data.id)
    })
  })

  describe('getBlockHeaders', async () => {
    it('should be a function', async () => {
      await expect(writeConnection.getBlockHeaders).toBeFunction()
    })

    it('should get the block headers', async () => {
      await writeConnection.saveBlock(genesisBlock)

      const blocks = await writeConnection.getBlockHeaders(0, 1)

      await expect(blocks).toBeObject()
      await expect(blocks[0]).toBeInstanceOf(Buffer)
    })
  })
})
