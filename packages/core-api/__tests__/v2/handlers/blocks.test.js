'use strict'

require('@arkecosystem/core-test-utils/lib/matchers')
const app = require('../../__support__/setup')
const utils = require('../utils')

let genesisBlock

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('@arkecosystem/core-test-utils/config/testnet/genesisBlock.json')
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 2.0 - Blocks', () => {
  describe('GET /blocks', () => {
    it('should GET all the blocks', async () => {
      const response = await utils.request('GET', 'blocks')
      expect(response).toBeSuccessfulResponse()
      expect(response).toBePaginated()
      expect(response.data.data).toBeArray()

      const block = response.data.data[0]
      utils.expectBlock(block)
    })
  })

  describe('GET /blocks/:id', () => {
    it('should GET a block by the given identifier', async () => {
      const response = await utils.request('GET', `blocks/${genesisBlock.id}`)
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeObject()

      const block = response.data.data
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
    })
  })

  describe('GET /blocks/:id/transactions', () => {
    it('should GET all the transactions for the given block by id', async () => {
      const response = await utils.request('GET', `blocks/${genesisBlock.id}/transactions`)
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.blockId).toBe(genesisBlock.id)
    })
  })

  describe('POST /blocks/search', () => {
    it('should POST a search for blocks with the exact specified blockId', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
    })

    it('should POST a search for blocks with the exact specified version', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, version: genesisBlock.version
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.version).toBe(genesisBlock.version)
    })

    it.skip('should POST a search for blocks with the exact specified previousBlock', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, previousBlock: genesisBlock.previousBlock
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.previous).toBe(genesisBlock.previousBlock)
    })

    it('should POST a search for blocks with the exact specified payloadHash', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, payloadHash: genesisBlock.payloadHash
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.payload.length).toBe(genesisBlock.payloadLength)
      expect(block.payload.hash).toBe(genesisBlock.payloadHash)
    })

    it('should POST a search for blocks with the exact specified generatorPublicKey', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, generatorPublicKey: genesisBlock.generatorPublicKey
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.generator.publicKey).toBe(genesisBlock.generatorPublicKey)
    })

    it('should POST a search for blocks with the exact specified blockSignature', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, blockSignature: genesisBlock.blockSignature
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.signature).toBe(genesisBlock.blockSignature)
    })

    it('should POST a search for blocks with the exact specified timestamp', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        timestamp: {
          from: genesisBlock.timestamp,
          to: genesisBlock.timestamp
        }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
    })

    it('should POST a search for blocks with the exact specified height', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        height: {
          from: genesisBlock.height,
          to: genesisBlock.height
        }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.height).toBe(genesisBlock.height)
    })

    it('should POST a search for blocks with the specified height range', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        height: {
          from: genesisBlock.height,
          to: genesisBlock.height
        }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.height).toBe(genesisBlock.height)
    })

    it('should POST a search for blocks with the exact specified numberOfTransactions', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        numberOfTransactions: {
          from: genesisBlock.numberOfTransactions,
          to: genesisBlock.numberOfTransactions
        }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.transactions).toBe(genesisBlock.numberOfTransactions)
    })

    it('should POST a search for blocks with the specified numberOfTransactions range', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        numberOfTransactions: {
          from: genesisBlock.numberOfTransactions,
          to: genesisBlock.numberOfTransactions
        }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.transactions).toBe(genesisBlock.numberOfTransactions)
    })

    it('should POST a search for blocks with the exact specified totalAmount', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        totalAmount: { from: 1 }
      })

      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
    })

    it('should POST a search for blocks with the specified totalAmount range', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        totalAmount: { from: 1 }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
    })

    it('should POST a search for blocks with the exact specified totalFee', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        totalFee: { from: 0 }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(+block.forged.fee).toBe(genesisBlock.totalFee)
    })

    it('should POST a search for blocks with the specified totalFee range', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        totalFee: { from: 0 }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(+block.forged.fee).toBe(genesisBlock.totalFee)
    })

    it('should POST a search for blocks with the exact specified reward', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        reward: {
          from: genesisBlock.reward,
          to: genesisBlock.reward
        }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(+block.forged.reward).toBe(genesisBlock.reward)
    })

    it('should POST a search for blocks with the specified reward range', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        reward: {
          from: genesisBlock.reward,
          to: genesisBlock.reward
        }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(+block.forged.reward).toBe(genesisBlock.reward)
    })

    it('should POST a search for blocks with the exact specified payloadLength', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        payloadLength: {
          from: genesisBlock.payloadLength,
          to: genesisBlock.payloadLength
        }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.payload.length).toBe(genesisBlock.payloadLength)
    })

    it('should POST a search for blocks with the specified payloadLength range', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        payloadLength: {
          from: genesisBlock.payloadLength,
          to: genesisBlock.payloadLength
        }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
      expect(block.payload.length).toBe(genesisBlock.payloadLength)
    })

    it('should POST a search for blocks with the wrong specified version', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, version: 2
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(0)
    })

    it('should POST a search for blocks with the specific criteria', async () => {
      const response = await utils.request('POST', 'blocks/search', {
        generatorPublicKey: genesisBlock.generatorPublicKey,
        version: genesisBlock.version,
        timestamp: {
          from: genesisBlock.timestamp,
          to: genesisBlock.timestamp
        }
      })
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()

      expect(response.data.data).toHaveLength(1)

      const block = response.data.data[0]
      utils.expectBlock(block)
      expect(block.id).toBe(genesisBlock.id)
    })
  })
})
