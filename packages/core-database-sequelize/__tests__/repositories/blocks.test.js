'use strict'

const app = require('../__support__/setup')
const createConnection = require('../__support__/utils/create-connection')
const genesisBlock = require('../__fixtures__/genesisBlock')

let connection
let repository

beforeAll(async (done) => {
  await app.setUp()

  connection = await createConnection()
  repository = connection.blocks

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(async (done) => {
  connection.disconnect()

  connection = await createConnection()
  repository = connection.blocks

  done()
})

describe('Block Repository', () => {
  it('should be an object', async () => {
    await expect(repository).toBeObject()
  })

  describe('findAll', async () => {
    it('should be a function', async () => {
      await expect(repository.findAll).toBeFunction()
    })

    it('should find all blocks', async () => {
      await connection.saveBlock(genesisBlock)

      const blocks = await repository.findAll()
      await expect(blocks.count).toBe(1)
    })
  })

  describe('findAllByGenerator', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllByGenerator).toBeFunction()
    })

    it('should find all blocks by the public key of the forger', async () => {
      await connection.saveBlock(genesisBlock)

      const blocks = await repository.findAllByGenerator(genesisBlock.data.generatorPublicKey)
      await expect(blocks.count).toBe(1)
    })
  })

  describe('findById', async () => {
    it('should be a function', async () => {
      await expect(repository.findById).toBeFunction()
    })

    it('should find a block by id', async () => {
      await connection.saveBlock(genesisBlock)

      const block = await repository.findById(genesisBlock.data.id)
      await expect(block).toBeObject()
      await expect(block.id).toBe(genesisBlock.data.id)
    })
  })

  describe('findLastByPublicKey', async () => {
    it('should be a function', async () => {
      await expect(repository.findLastByPublicKey).toBeFunction()
    })

    it('should find the last forged block by public key', async () => {
      await connection.saveBlock(genesisBlock)

      const block = await repository.findLastByPublicKey(genesisBlock.data.generatorPublicKey)
      await expect(block).toBeObject()
      await expect(block.id).toBe(genesisBlock.data.id)
    })
  })

  describe('findAllByDateTimeRange', async () => {
    const expectBlocksToBe = async (expected, from, to) => {
      const fakeBlock = genesisBlock
      fakeBlock.data.timestamp = 100
      await connection.saveBlock(fakeBlock)

      const blocks = await repository.findAllByDateTimeRange(from, to)
      await expect(blocks).toBeObject()

      await expect(blocks).toHaveProperty('count')
      await expect(blocks.count).toBeNumber()

      await expect(blocks).toHaveProperty('rows')
      await expect(blocks.rows).toBeObject()

      await expect(blocks.count).toBe(expected)
    }

    it('should be a function', async () => {
      await expect(repository.findAllByDateTimeRange).toBeFunction()
    })

    it('should find blocks by from -> to range', async () => {
      await expectBlocksToBe(1, 0, 100)
    })

    it('should not find blocks by "from" range', async () => {
      await expectBlocksToBe(0, 101)
    })

    it('should not find blocks by "to" range', async () => {
      await expectBlocksToBe(0, 0, 99)
    })
  })

  describe('search', async () => {
    const expectSearch = async (params) => {
      await connection.saveBlock(genesisBlock)

      const blocks = await repository.search(params)
      await expect(blocks).toBeObject()

      await expect(blocks).toHaveProperty('count')
      await expect(blocks.count).toBeNumber()

      await expect(blocks).toHaveProperty('rows')
      await expect(blocks.rows).toBeObject()
      await expect(blocks.rows).not.toBeEmpty()

      await expect(blocks.count).toBe(1)
    }

    it('should be a function', async () => {
      await expect(repository.search).toBeFunction()
    })

    it('should search blocks by the specified id', async () => {
      await expectSearch({
        id: genesisBlock.data.id
      })
    })

    it('should search blocks by the specified previousBlock', async () => {
      await expectSearch({
        previousBlock: genesisBlock.data.previousBlock
      })
    })

    it('should search blocks by the specified ID', async () => {
      await expectSearch({
        payloadHash: genesisBlock.data.payloadHash
      })
    })

    it('should search blocks by the specified generatorPublicKey', async () => {
      await expectSearch({
        generatorPublicKey: genesisBlock.data.generatorPublicKey
      })
    })

    it('should search blocks by the specified blockSignature', async () => {
      await expectSearch({
        blockSignature: genesisBlock.data.blockSignature
      })
    })

    it('should search blocks by the specified timestamp', async () => {
      await expectSearch({
        timestamp: {
          from: genesisBlock.data.timestamp,
          to: genesisBlock.data.timestamp
        }
      })
    })

    it('should search blocks by the specified height', async () => {
      await expectSearch({
        height: {
          from: genesisBlock.data.height,
          to: genesisBlock.data.height
        }
      })
    })

    it('should search blocks by the specified numberOfTransactions', async () => {
      await expectSearch({
        numberOfTransactions: {
          from: genesisBlock.data.numberOfTransactions,
          to: genesisBlock.data.numberOfTransactions
        }
      })
    })

    it('should search blocks by the specified totalAmount', async () => {
      await expectSearch({
        totalAmount: {
          from: genesisBlock.data.totalAmount,
          to: genesisBlock.data.totalAmount
        }
      })
    })

    it('should search blocks by the specified totalFee', async () => {
      await expectSearch({
        totalFee: {
          from: genesisBlock.data.totalFee,
          to: genesisBlock.data.totalFee
        }
      })
    })

    it('should search blocks by the specified reward', async () => {
      await expectSearch({
        reward: {
          from: genesisBlock.data.reward,
          to: genesisBlock.data.reward
        }
      })
    })

    it('should search blocks by the specified payloadLength', async () => {
      await expectSearch({
        payloadLength: {
          from: genesisBlock.data.payloadLength,
          to: genesisBlock.data.payloadLength
        }
      })
    })
  })

  describe('totalsByGenerator', async () => {
    it('should be a function', async () => {
      await expect(repository.totalsByGenerator).toBeFunction()
    })

    it('should return the total fees and rewards', async () => {
      await connection.saveBlock(genesisBlock)

      const totals = await repository.totalsByGenerator(genesisBlock.data.generatorPublicKey)
      await expect(totals).toBeObject()

      await expect(totals).toHaveProperty('fees')
      await expect(totals.fees).toBeNumber()

      await expect(totals).toHaveProperty('forged')
      await expect(totals.forged).toBeNumber()

      await expect(totals).toHaveProperty('rewards')
      await expect(totals.rewards).toBeNumber()
    })
  })
})
