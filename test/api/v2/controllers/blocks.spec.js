const Helpers = require('../helpers')

const blockId = '6995950265304491676'

describe('API 2.0 - Blocks', () => {
  describe('GET /api/blocks', () => {
    it('should GET all the blocks', (done) => {
      Helpers.request('GET', 'blocks').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)
        Helpers.assertPaginator(res)

        const block = res.body.data[0]
        block.should.have.property('id').which.is.a('string')
        block.should.have.property('version').which.is.a('number')
        block.should.have.property('height').which.is.a('number')
        block.should.have.property('previous').which.is.a('string')

        block.should.have.property('forged').which.is.an('object')
        block.forged.should.have.property('reward').which.is.an('number')
        block.forged.should.have.property('fee').which.is.an('number')

        block.should.have.property('payload').which.is.an('object')
        block.payload.should.have.property('length').which.is.an('number')
        block.payload.should.have.property('hash').which.is.an('string')

        block.should.have.property('generator').which.is.an('object')
        block.generator.should.have.property('public_key').which.is.an('string')

        block.should.have.property('signature').which.is.an('string')
        block.should.have.property('transactions').which.is.an('number')

        done()
      })
    })
  })

  describe('GET /api/blocks/:id', () => {
    it('should GET a block by the given id', (done) => {
      Helpers.request('GET', `blocks/${blockId}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('id').which.is.a('string')
        res.body.data.should.have.property('version').which.is.a('number')
        res.body.data.should.have.property('height').which.is.a('number')
        res.body.data.should.have.property('previous').which.is.a('string')

        res.body.data.should.have.property('forged').which.is.an('object')
        res.body.data.forged.should.have.property('reward').which.is.an('number')
        res.body.data.forged.should.have.property('fee').which.is.an('number')

        res.body.data.should.have.property('payload').which.is.an('object')
        res.body.data.payload.should.have.property('length').which.is.an('number')
        res.body.data.payload.should.have.property('hash').which.is.an('string')

        res.body.data.should.have.property('generator').which.is.an('object')
        res.body.data.generator.should.have.property('public_key').which.is.an('string')

        res.body.data.should.have.property('signature').which.is.an('string')
        res.body.data.should.have.property('transactions').which.is.an('number')

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
        transaction.should.have.property('id').which.is.a('string')
        transaction.should.have.property('block_id').which.is.a('string').and.equals(blockId)
        transaction.should.have.property('type').which.is.a('number')
        transaction.should.have.property('amount').which.is.a('number')
        transaction.should.have.property('fee').which.is.a('number')
        transaction.should.have.property('sender').which.is.a('string')
        transaction.should.have.property('recipient').which.is.a('string')
        transaction.should.have.property('signature').which.is.a('string')
        transaction.should.have.property('confirmations').which.is.a('number')

        done()
      })
    })
  })

  describe('POST /api/blocks/search', () => {
    it('should POST a search for blocks with the specified criteria', (done) => {
      Helpers.request('POST', 'blocks/search', { id: blockId }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const block = res.body.data[0]
        block.should.have.property('id').which.is.a('string').and.equals(blockId)
        block.should.have.property('version').which.is.a('number')
        block.should.have.property('height').which.is.a('number')
        block.should.have.property('previous').which.is.a('string')

        block.should.have.property('forged').which.is.an('object')
        block.forged.should.have.property('reward').which.is.an('number')
        block.forged.should.have.property('fee').which.is.an('number')

        block.should.have.property('payload').which.is.an('object')
        block.payload.should.have.property('length').which.is.an('number')
        block.payload.should.have.property('hash').which.is.an('string')

        block.should.have.property('generator').which.is.an('object')
        block.generator.should.have.property('public_key').which.is.an('string')

        block.should.have.property('signature').which.is.an('string')
        block.should.have.property('transactions').which.is.an('number')

        done()
      })
    })
  })
})
