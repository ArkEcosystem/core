const Helpers = require('../helpers')

const transactionId = '1d151056a431f14909c9e9c7b11d6f40eb5fe01f07afa206e45c1cb4080a1e09'

describe('API 2.0 - Transactions', () => {
  describe('GET /api/transactions', () => {
    it('should GET all the transactions', (done) => {
      Helpers.request('GET', 'transactions').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        const transaction = res.body.data[0]
        transaction.should.be.an('object')
        transaction.should.have.property('id').which.is.a('string')
        transaction.should.have.property('block_id').which.is.a('string')
        transaction.should.have.property('type').which.is.a('number')
        transaction.should.have.property('amount').which.is.a('number')
        transaction.should.have.property('fee').which.is.a('number')
        transaction.should.have.property('sender').which.is.a('string')
        transaction.should.have.property('signature').which.is.a('string')
        transaction.should.have.property('confirmations').which.is.a('number')

        done()
      })
    })
  })

  describe.skip('GET /api/transactions/:id', () => {
    it('should GET a transaction by the given identifier', (done) => {
      Helpers.request('GET', `transactions/${transactionId}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('id').which.is.a('string').and.equals(transactionId)
        res.body.data.should.have.property('block_id').which.is.a('string')
        res.body.data.should.have.property('type').which.is.a('number')
        res.body.data.should.have.property('amount').which.is.a('number')
        res.body.data.should.have.property('fee').which.is.a('number')
        res.body.data.should.have.property('sender').which.is.a('string')
        res.body.data.should.have.property('recipient').which.is.a('string')
        res.body.data.should.have.property('signature').which.is.a('string')
        res.body.data.should.have.property('confirmations').which.is.a('number')

        done()
      })
    })
  })

  describe.skip('GET /api/transactions/unconfirmed', () => {
    it('should GET all the unconfirmed transactions', (done) => {
      Helpers.request('GET', 'transactions/unconfirmed').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        done()
      })
    })
  })

  describe.skip('GET /api/transactions/unconfirmed/:id', () => {
    it('should GET an unconfirmed transaction by the given identifier', (done) => {
      Helpers.request('GET', 'transactions/unconfirmed/:id').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        done()
      })
    })
  })

  describe('GET /api/transactions/search', () => {
    it('should POST a search for transactions with the specified criteria', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        res.body.should.have.property('data').which.is.an('array').with.lengthOf(1)

        const transaction = res.body.data[0]
        transaction.should.have.property('id').which.is.a('string').and.equals(transactionId)
        transaction.should.have.property('block_id').which.is.a('string')
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
})
