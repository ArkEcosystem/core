'use strict'

require('../../__support__/setup')

const utils = require('../utils')
const genesisBlock = require('../../__support__/config/genesisBlock.json')

describe('API 2.0 - Blocks', () => {
  describe('GET /blocks', () => {
    it('should GET all the blocks', async () => {
      const response = await utils.request('GET', 'blocks')
      await utils.assertSuccessful(response)
      await utils.assertCollection(response)
      await utils.assertPaginator(response)

      const block = response.body.data[0]
      await utils.assertBlock(block)
    })
  })

  describe('GET /blocks/:id', () => {
    it('should GET a block by the given identifier', async () => {
      const res = await utils.request('GET', `blocks/${genesisBlock.id}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      const block = res.body.data;
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
    })
  })

  describe('GET /blocks/:id/transactions', () => {
    it('should GET all the transactions for the given block by id', async () => {
      const res = await utils.request('GET', `blocks/${genesisBlock.id}/transactions`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.blockId).toBe(genesisBlock.id)
    })
  })

  describe.only('POST /blocks/search', () => {
    it('should POST a search for blocks with the exact specified blockId', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
    })

    it('should POST a search for blocks with the exact specified version', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, version: genesisBlock.version
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.version).toBe(genesisBlock.version)
    })

    it.skip('should POST a search for blocks with the exact specified previousBlock', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, previousBlock: genesisBlock.previousBlock
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.previous).toBe(genesisBlock.previousBlock)
    })

    it('should POST a search for blocks with the exact specified payloadHash', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, payloadHash: genesisBlock.payloadHash
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.payload.length).toBe(genesisBlock.payloadLength)
      await expect(block.payload.hash).toBe(genesisBlock.payloadHash)
    })

    it('should POST a search for blocks with the exact specified generatorPublicKey', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, generatorPublicKey: genesisBlock.generatorPublicKey
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.generator.publicKey).toBe(genesisBlock.generatorPublicKey)
    })

    it('should POST a search for blocks with the exact specified blockSignature', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, blockSignature: genesisBlock.blockSignature
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.signature).toBe(genesisBlock.blockSignature)
    })

    it('should POST a search for blocks with the exact specified timestamp', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        timestamp: {
          from: genesisBlock.timestamp,
          to: genesisBlock.timestamp
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
    })

    it('should POST a search for blocks with the exact specified height', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        height: {
          from: genesisBlock.height,
          to: genesisBlock.height
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.height).toBe(genesisBlock.height)
    })

    it('should POST a search for blocks with the specified height range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        height: {
          from: genesisBlock.height,
          to: genesisBlock.height
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.height).toBe(genesisBlock.height)
    })

    it('should POST a search for blocks with the exact specified numberOfTransactions', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        numberOfTransactions: {
          from: genesisBlock.numberOfTransactions,
          to: genesisBlock.numberOfTransactions
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.transactions).toBe(genesisBlock.numberOfTransactions)
    })

    it('should POST a search for blocks with the specified numberOfTransactions range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        numberOfTransactions: {
          from: genesisBlock.numberOfTransactions,
          to: genesisBlock.numberOfTransactions
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.transactions).toBe(genesisBlock.numberOfTransactions)
    })

    it('should POST a search for blocks with the exact specified totalAmount', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        totalAmount: { from: 1 }
      })

      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
    })

    it('should POST a search for blocks with the specified totalAmount range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        totalAmount: { from: 1 }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
    })

    it('should POST a search for blocks with the exact specified totalFee', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        totalFee: { from: 1 }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(+block.forged.fee).toBe(genesisBlock.totalFee)
    })

    it('should POST a search for blocks with the specified totalFee range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        totalFee: { from: 1 }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(+block.forged.fee).toBe(genesisBlock.totalFee)
    })

    it('should POST a search for blocks with the exact specified reward', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        reward: {
          from: genesisBlock.reward,
          to: genesisBlock.reward
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(+block.forged.reward).toBe(genesisBlock.reward)
    })

    it('should POST a search for blocks with the specified reward range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        reward: {
          from: genesisBlock.reward,
          to: genesisBlock.reward
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(+block.forged.reward).toBe(genesisBlock.reward)
    })

    it('should POST a search for blocks with the exact specified payloadLength', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        payloadLength: {
          from: genesisBlock.payloadLength,
          to: genesisBlock.payloadLength
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.payload.length).toBe(genesisBlock.payloadLength)
    })

    it('should POST a search for blocks with the specified payloadLength range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id,
        payloadLength: {
          from: genesisBlock.payloadLength,
          to: genesisBlock.payloadLength
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
      await expect(block.payload.length).toBe(genesisBlock.payloadLength)
    })

    it('should POST a search for blocks with the wrong specified version', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: genesisBlock.id, version: 2
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(0)
    })

    it('should POST a search for blocks with the specific criteria', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        generatorPublicKey: genesisBlock.generatorPublicKey,
        version: genesisBlock.version,
        timestamp: {
          from: genesisBlock.timestamp,
          to: genesisBlock.timestamp
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(genesisBlock.id)
    })
  })
})
