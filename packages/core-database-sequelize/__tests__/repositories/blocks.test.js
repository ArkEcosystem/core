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
  it('should be an object', () => {
    expect(repository).toBeObject()
  })

  describe('findAll', () => {
    it('should be a function', () => {
      expect(repository.findAll).toBeFunction()
    })

    it('should find all blocks', async () => {
      await connection.saveBlock(genesisBlock)

      const blocks = await repository.findAll()
      expect(blocks.count).toBe(1)
    })
  })

  describe('findAllByGenerator', () => {
    it('should be a function', () => {
      expect(repository.findAllByGenerator).toBeFunction()
    })

    it('should find all blocks by the public key of the forger', async () => {
      await connection.saveBlock(genesisBlock)

      const blocks = await repository.findAllByGenerator(genesisBlock.data.generatorPublicKey)
      expect(blocks.count).toBe(1)
    })
  })

  describe('findById', () => {
    it('should be a function', () => {
      expect(repository.findById).toBeFunction()
    })

    it('should find a block by id', async () => {
      await connection.saveBlock(genesisBlock)

      const block = await repository.findById(genesisBlock.data.id)
      expect(block).toBeObject()
      expect(block.id).toBe(genesisBlock.data.id)
    })
  })

  describe('findLastByPublicKey', () => {
    it('should be a function', () => {
      expect(repository.findLastByPublicKey).toBeFunction()
    })

    it('should find the last forged block by public key', async () => {
      await connection.saveBlock(genesisBlock)

      const block = await repository.findLastByPublicKey(genesisBlock.data.generatorPublicKey)
      expect(block).toBeObject()
      expect(block.id).toBe(genesisBlock.data.id)
    })
  })

  describe('search', async () => {
    const expectSearch = async (params) => {
      await connection.saveBlock(genesisBlock)

      const blocks = await repository.search(params)
      expect(blocks).toBeObject()

      expect(blocks).toHaveProperty('count')
      expect(blocks.count).toBeNumber()

      expect(blocks).toHaveProperty('rows')
      expect(blocks.rows).toBeObject()
      expect(blocks.rows).not.toBeEmpty()

      expect(blocks.count).toBe(1)
    }

    it('should be a function', () => {
      expect(repository.search).toBeFunction()
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
})
