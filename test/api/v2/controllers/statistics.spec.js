const Helpers = require('../helpers')

describe('API 2.0 - Statistics', () => {
  describe('GET /api/stats/blockchain', () => {
    it('should GET the blockchain statistics', (done) => {
      Helpers.request('GET', 'stats/blockchain').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('supply').which.is.a('object')
        res.body.data.supply.should.have.property('initial').which.is.a('number')
        res.body.data.supply.should.have.property('current').which.is.a('number')

        res.body.data.should.have.property('blocks').which.is.a('object')
        res.body.data.blocks.should.have.property('forged').which.is.a('number')
        res.body.data.blocks.should.have.property('rewards').which.is.a('number')

        res.body.data.should.have.property('rewards').which.is.a('object')
        res.body.data.rewards.should.have.property('start').which.is.a('number')
        res.body.data.rewards.should.have.property('total').which.is.a('number')

        res.body.data.should.have.property('productivity').which.is.a('object')
        res.body.data.productivity.best.should.have.property('username').which.is.a('string')
        res.body.data.productivity.best.should.have.property('productivity').which.is.a('string')

        res.body.data.productivity.should.have.property('worst').which.is.a('object')
        res.body.data.productivity.worst.should.have.property('username').which.is.a('string')
        res.body.data.productivity.worst.should.have.property('productivity').which.is.a('string')

        done()
      })
    })
  })

  describe('GET /api/stats/transactions', () => {
    it('should GET the transaction statistics', (done) => {
      Helpers.request('GET', 'stats/transactions').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('count').which.is.a('number')
        res.body.data.should.have.property('amount').which.is.a('number')
        res.body.data.should.have.property('fees').which.is.a('number')

        done()
      })
    })
  })

  describe('GET /api/stats/blocks', () => {
    it('should GET the block statistics', (done) => {
      Helpers.request('GET', 'stats/blocks').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('count').which.is.a('number')
        res.body.data.should.have.property('rewards').which.is.a('number')
        res.body.data.should.have.property('fees').which.is.a('number')

        done()
      })
    })
  })

  describe('GET /api/stats/votes', () => {
    it('should GET the vote statistics', (done) => {
      Helpers.request('GET', 'stats/votes').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('count').which.is.a('number')
        res.body.data.should.have.property('amount').which.is.a('number')
        res.body.data.should.have.property('fees').which.is.a('number')

        done()
      })
    })
  })

  describe('GET /api/stats/unvotes', () => {
    it('should GET the unvote statistics', (done) => {
      Helpers.request('GET', 'stats/unvotes').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('count').which.is.a('number')
        res.body.data.should.have.property('amount').which.is.a('number')
        res.body.data.should.have.property('fees').which.is.a('number')

        done()
      })
    })
  })
})
