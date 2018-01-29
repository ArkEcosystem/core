const Helpers = require('../helpers')

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
      Helpers.request('GET', 'blocks').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)
        Helpers.assertPaginator(res)

        const block = res.body.data[1]
        Helpers.assertBlock(block)

        done()
      })
    })
  })

  describe('GET /api/blocks/:id', () => {
    it('should GET a block by the given identifier', (done) => {
      Helpers.request('GET', `blocks/${blockId}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        const block = res.body.data;
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)

        done()
      })
    })
  })

  describe('GET /api/blocks/:id/transactions', () => {
    it('should GET all the transactions for the given block by id', (done) => {
      Helpers.request('GET', `blocks/${blockId}/transactions`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        transaction.block_id.should.equal(blockId)

        done()
      })
    })
  })

  describe('POST /api/blocks/search', () => {
    it('should POST a search for blocks with the exact specified blockId', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified version', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, version }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.version.should.equal(version)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified previousBlock', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, previousBlock }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.previous.should.equal(previousBlock)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified payloadHash', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, payloadHash }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.payload.length.should.equal(payloadLength)
        block.payload.hash.should.equal(payloadHash)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified generatorPublicKey', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, generatorPublicKey }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.generator.public_key.should.equal(generatorPublicKey)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified blockSignature', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, blockSignature }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.signature.should.equal(blockSignature)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified timestamp', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, timestamp }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified height', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, height }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.height.should.equal(height)

        done()
      })
    })

    it('should POST a search for blocks with the specified height range', (done) => {
      Helpers.request('POST', 'blocks/search', {
        id: blockId,
        height: {
          from: heightFrom,
          to: heightTo
        }
      }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.height.should.equal(height)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified numberOfTransactions', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, numberOfTransactions }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.transactions.should.equal(numberOfTransactions)

        done()
      })
    })

    it('should POST a search for blocks with the specified numberOfTransactions range', (done) => {
      Helpers.request('POST', 'blocks/search', {
        id: blockId,
        numberOfTransactions: {
          from: numberOfTransactionsFrom,
          to: numberOfTransactionsTo
        }
      }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.transactions.should.equal(numberOfTransactions)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified totalAmount', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, totalAmount }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)

        done()
      })
    })

    it('should POST a search for blocks with the specified totalAmount range', (done) => {
      Helpers.request('POST', 'blocks/search', {
        id: blockId,
        totalAmount: {
          from: totalAmountFrom,
          to: totalAmountTo
        }
      }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified totalFee', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, totalFee }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.forged.fee.should.equal(totalFee)

        done()
      })
    })

    it('should POST a search for blocks with the specified totalFee range', (done) => {
      Helpers.request('POST', 'blocks/search', {
        id: blockId,
        totalFee: {
          from: totalFeeFrom,
          to: totalFeeTo
        }
      }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.forged.fee.should.equal(totalFee)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified reward', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, reward }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.forged.reward.should.equal(reward)

        done()
      })
    })

    it('should POST a search for blocks with the specified reward range', (done) => {
      Helpers.request('POST', 'blocks/search', {
        id: blockId,
        reward: {
          from: rewardFrom,
          to: rewardTo
        }
      }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.forged.reward.should.equal(reward)

        done()
      })
    })

    it('should POST a search for blocks with the exact specified payloadLength', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, payloadLength }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.payload.length.should.equal(payloadLength)

        done()
      })
    })

    it('should POST a search for blocks with the specified payloadLength range', (done) => {
      Helpers.request('POST', 'blocks/search', {
        id: blockId,
        payloadLength: {
          from: payloadLengthFrom,
          to: payloadLengthTo
        }
      }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)
        block.payload.length.should.equal(payloadLength)

        done()
      })
    })

    it('should POST a search for blocks with the wrong specified version', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId, version: wrongVersion }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').that.is.empty

        done()
      })
    })

    it('should POST a search for blocks with the specific criteria', (done) => {
      Helpers.request('POST', 'blocks/search', {
        generatorPublicKey,
        version,
        timestamp: {
          from: timestampFrom,
          to: timestampTo,
        }
      }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        Helpers.assertBlock(block)
        block.id.should.equal(blockId)

        done()
      })
    })
  })
})
