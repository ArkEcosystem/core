const utils = require('../utils')

describe('API 2.0 - Statistics', () => {
  describe('GET /api/statistics/blockchain', () => {
    it('should GET the blockchain statistics', (done) => {
      utils.request('GET', 'statistics/blockchain').end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertResource(res)

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

  describe('GET /api/statistics/transactions', () => {
    it('should GET the transaction statistics', (done) => {
      utils.request('GET', 'statistics/transactions').end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertResource(res)

        expect(res.body.data.count).toBeType('number')
        expect(res.body.data.amount).toBeType('number')
        expect(res.body.data.fees).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/statistics/blocks', () => {
    it('should GET the block statistics', (done) => {
      utils.request('GET', 'statistics/blocks').end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertResource(res)

        expect(res.body.data.count).toBeType('number')
        expect(res.body.data.rewards).toBeType('number')
        expect(res.body.data.fees).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/statistics/votes', () => {
    it('should GET the vote statistics', (done) => {
      utils.request('GET', 'statistics/votes').end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertResource(res)

        expect(res.body.data.count).toBeType('number')
        expect(res.body.data.amount).toBeType('number')
        expect(res.body.data.fees).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/statistics/unvotes', () => {
    it('should GET the unvote statistics', (done) => {
      utils.request('GET', 'statistics/unvotes').end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertResource(res)

        expect(res.body.data.count).toBeType('number')
        expect(res.body.data.amount).toBeType('number')
        expect(res.body.data.fees).toBeType('number')

        done()
      })
    })
  })
})
