const utils = require('../utils')

const blockId = '6995950265304491676'
const version = 0
const wrongVersion = 1
const previousBlock = '16934430250273572763'
const payloadHash = '705a0c79c30269f013bf4b6aec260f848eead57e036e730654b6d6acd09ba3d0'
const generatorPublicKey = '0326580718fc86ba609799ac95fcd2721af259beb5afa81bfce0ab7d9fe95de991'
const blockSignature = '304402202c2fec8a929d05e2913d11fe942ed3c4b9a84c92d5676e0ae30d49cba66129cb022027a2e13dfab6297673a3f969fbdaa077807e850d0cebb7235e9ab81f4715c30f'
const timestamp = 26680224
const timestampFrom = 26680223
const timestampTo = 26680225
const height = 2390645
const heightFrom = 2390644
const heightTo = 2390646
const numberOfTransactions = 5
const numberOfTransactionsFrom = 4
const numberOfTransactionsTo = 6
const totalAmount = 29811060
const totalAmountFrom = 29811059
const totalAmountTo = 29811061
const totalFee = 50000000
const totalFeeFrom = 40000000
const totalFeeTo = 60000000
const reward = 200000000
const rewardFrom = 100000000
const rewardTo = 300000000
const payloadLength = 160
const payloadLengthFrom = 159
const payloadLengthTo = 161

describe('API 2.0 - Blocks', () => {
  describe('GET /api/blocks', () => {
    it('should GET all the blocks', async () => {
      const res = await utils.request('GET', 'blocks')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
      await utils.assertPaginator(res)

      const block = res.body.data[1]
      await utils.assertBlock(block)
    })
  })

  describe('GET /api/blocks/:id', () => {
    it('should GET a block by the given identifier', async () => {
      const res = await utils.request('GET', `blocks/${blockId}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      const block = res.body.data;
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
    })
  })

  describe('GET /api/blocks/:id/transactions', () => {
    it('should GET all the transactions for the given block by id', async () => {
      const res = await utils.request('GET', `blocks/${blockId}/transactions`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.blockId).toBe(blockId)
    })
  })

  describe('POST /api/blocks/search', () => {
    it('should POST a search for blocks with the exact specified blockId', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
    })

    it('should POST a search for blocks with the exact specified version', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, version })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.version).toBe(version)
    })

    it('should POST a search for blocks with the exact specified previousBlock', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, previousBlock })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.previous).toBe(previousBlock)
    })

    it('should POST a search for blocks with the exact specified payloadHash', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, payloadHash })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.payload.length).toBe(payloadLength)
      await expect(block.payload.hash).toBe(payloadHash)
    })

    it('should POST a search for blocks with the exact specified generatorPublicKey', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, generatorPublicKey })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.generator.publicKey).toBe(generatorPublicKey)
    })

    it('should POST a search for blocks with the exact specified blockSignature', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, blockSignature })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.signature).toBe(blockSignature)
    })

    it('should POST a search for blocks with the exact specified timestamp', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, timestamp })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
    })

    it('should POST a search for blocks with the exact specified height', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, height })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.height).toBe(height)
    })

    it('should POST a search for blocks with the specified height range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: blockId,
        heightFrom,
        heightTo
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.height).toBe(height)
    })

    it('should POST a search for blocks with the exact specified numberOfTransactions', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, numberOfTransactions })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.transactions).toBe(numberOfTransactions)
    })

    it('should POST a search for blocks with the specified numberOfTransactions range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: blockId,
        numberOfTransactionsFrom,
        numberOfTransactionsTo
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.transactions).toBe(numberOfTransactions)
    })

    it('should POST a search for blocks with the exact specified totalAmount', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, totalAmount })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
    })

    it('should POST a search for blocks with the specified totalAmount range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: blockId,
        totalAmountFrom,
        totalAmountTo
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
    })

    it('should POST a search for blocks with the exact specified totalFee', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, totalFee })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.forged.fee).toBe(totalFee)
    })

    it('should POST a search for blocks with the specified totalFee range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: blockId,
        totalFeeFrom,
        totalFeeTo
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.forged.fee).toBe(totalFee)
    })

    it('should POST a search for blocks with the exact specified reward', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, reward })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.forged.reward).toBe(reward)
    })

    it('should POST a search for blocks with the specified reward range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: blockId,
        reward: {
          from: rewardFrom,
          to: rewardTo
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.forged.reward).toBe(reward)
    })

    it('should POST a search for blocks with the exact specified payloadLength', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, payloadLength })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.payload.length).toBe(payloadLength)
    })

    it('should POST a search for blocks with the specified payloadLength range', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        id: blockId,
        payloadLengthFrom,
        payloadLengthTo
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
      await expect(block.payload.length).toBe(payloadLength)
    })

    it('should POST a search for blocks with the wrong specified version', async () => {
      const res = await utils.request('POST', 'blocks/search', { id: blockId, version: wrongVersion })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(0)
    })

    it('should POST a search for blocks with the specific criteria', async () => {
      const res = await utils.request('POST', 'blocks/search', {
        generatorPublicKey,
        version,
        timestampFrom,
        timestampTo
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const block = res.body.data[0]
      await utils.assertBlock(block)
      await expect(block.id).toBe(blockId)
    })
  })
})
