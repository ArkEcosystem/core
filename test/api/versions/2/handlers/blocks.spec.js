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
    it('should GET all the blocks', (done) => {
      utils.request('GET', 'blocks').end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)
        utils.assertPaginator(res)

        const block = res.body.data[1]
        utils.assertBlock(block)

        done()
      })
    })
  })

  describe('GET /api/blocks/:id', () => {
    it('should GET a block by the given identifier', (done) => {
      utils.request('GET', `blocks/${blockId}`).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertResource(res)

        const block = res.body.data;
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)

        done()
      })
    })
  })

  describe('GET /api/blocks/:id/transactions', () => {
    // jest.setTimeout(10000)

    it('should GET all the transactions for the given block by id', (done) => {
      utils.request('GET', `blocks/${blockId}/transactions`).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        const transaction = res.body.data[0]
        utils.assertTransaction(transaction)
        expect(transaction.block_id).toBe(blockId)

        done()
      })
    })
  })

  describe('GET /api/blocks/search', () => {
    it('should GET a search for blocks with the exact specified blockId', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified version', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, version }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.version).toBe(version)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified previousBlock', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, previousBlock }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.previous).toBe(previousBlock)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified payloadHash', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, payloadHash }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.payload.length).toBe(payloadLength)
        expect(block.payload.hash).toBe(payloadHash)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified generatorPublicKey', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, generatorPublicKey }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.generator.public_key).toBe(generatorPublicKey)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified blockSignature', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, blockSignature }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.signature).toBe(blockSignature)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified timestamp', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, timestamp }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified height', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, height }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.height).toBe(height)

        done()
      })
    })

    it('should GET a search for blocks with the specified height range', (done) => {
      utils.request('GET', 'blocks/search', {
        id: blockId,
        heightFrom,
        heightTo
      }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.height).toBe(height)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified numberOfTransactions', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, numberOfTransactions }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.transactions).toBe(numberOfTransactions)

        done()
      })
    })

    it('should GET a search for blocks with the specified numberOfTransactions range', (done) => {
      utils.request('GET', 'blocks/search', {
        id: blockId,
        numberOfTransactionsFrom,
        numberOfTransactionsTo
      }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.transactions).toBe(numberOfTransactions)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified totalAmount', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, totalAmount }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)

        done()
      })
    })

    it('should GET a search for blocks with the specified totalAmount range', (done) => {
      utils.request('GET', 'blocks/search', {
        id: blockId,
        totalAmountFrom,
        totalAmountTo
      }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified totalFee', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, totalFee }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.forged.fee).toBe(totalFee)

        done()
      })
    })

    it('should GET a search for blocks with the specified totalFee range', (done) => {
      utils.request('GET', 'blocks/search', {
        id: blockId,
        totalFeeFrom,
        totalFeeTo
      }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.forged.fee).toBe(totalFee)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified reward', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, reward }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.forged.reward).toBe(reward)

        done()
      })
    })

    it('should GET a search for blocks with the specified reward range', (done) => {
      utils.request('GET', 'blocks/search', {
        id: blockId,
        reward: {
          from: rewardFrom,
          to: rewardTo
        }
      }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.forged.reward).toBe(reward)

        done()
      })
    })

    it('should GET a search for blocks with the exact specified payloadLength', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, payloadLength }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.payload.length).toBe(payloadLength)

        done()
      })
    })

    it('should GET a search for blocks with the specified payloadLength range', (done) => {
      utils.request('GET', 'blocks/search', {
        id: blockId,
        payloadLengthFrom,
        payloadLengthTo
      }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)
        expect(block.payload.length).toBe(payloadLength)

        done()
      })
    })

    it('should GET a search for blocks with the wrong specified version', (done) => {
      utils.request('GET', 'blocks/search', { id: blockId, version: wrongVersion }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(0)

        done()
      })
    })

    it.skip('should GET a search for blocks with the specific criteria', (done) => {
      utils.request('GET', 'blocks/search', {
        generatorPublicKey,
        version,
        timestampFrom,
        timestampTo
      }).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const block = res.body.data[0]
        utils.assertBlock(block)
        expect(block.id).toBe(blockId)

        done()
      })
    })
  })
})
