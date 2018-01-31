const Helpers = require('../helpers')

describe('API 2.0 - Statistics', () => {
  describe('GET /api/stats/blockchain', () => {
    it('should GET the blockchain statistics', (done) => {
      Helpers.request('GET', 'stats/blockchain').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data.supply).toBeType('object')
        expect(res.body.data.supply.initial).toBeType('number')
        expect(res.body.data.supply.current).toBeType('number')

        expect(res.body.data.blocks).toBeType('object')
        expect(res.body.data.blocks.forged).toBeType('number')
        expect(res.body.data.blocks.rewards).toBeType('number')

        expect(res.body.data.rewards).toBeType('object')
        expect(res.body.data.rewards.start).toBeType('number')
        expect(res.body.data.rewards.total).toBeType('number')

        expect(res.body.data.productivity).toBeType('object')
        expect(res.body.data.productivity.best.username).toBeType('string')
        expect(res.body.data.productivity.best.productivity).toBeType('string')

        expect(res.body.data.productivity.worst).toBeType('object')
        expect(res.body.data.productivity.worst.username).toBeType('string')
        expect(res.body.data.productivity.worst.productivity).toBeType('string')

        done()
      })
    })
  })

  describe('GET /api/stats/transactions', () => {
    it('should GET the transaction statistics', (done) => {
      Helpers.request('GET', 'stats/transactions').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data.count).toBeType('number')
        expect(res.body.data.amount).toBeType('number')
        expect(res.body.data.fees).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/stats/blocks', () => {
    it('should GET the block statistics', (done) => {
      Helpers.request('GET', 'stats/blocks').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data.count).toBeType('number')
        expect(res.body.data.rewards).toBeType('number')
        expect(res.body.data.fees).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/stats/votes', () => {
    it('should GET the vote statistics', (done) => {
      Helpers.request('GET', 'stats/votes').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data.count).toBeType('number')
        expect(res.body.data.amount).toBeType('number')
        expect(res.body.data.fees).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/stats/unvotes', () => {
    it('should GET the unvote statistics', (done) => {
      Helpers.request('GET', 'stats/unvotes').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data.count).toBeType('number')
        expect(res.body.data.amount).toBeType('number')
        expect(res.body.data.fees).toBeType('number')

        done()
      })
    })
  })
})
