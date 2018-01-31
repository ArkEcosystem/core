const Helpers = require('../helpers')

describe('API 2.0 - Blockchain', () => {
  describe('GET /api/blockchain', () => {
    it('should GET the blockchain constants', (done) => {
      Helpers.request('GET', 'blockchain').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        expect(res.body.data).toBeType('object')
        expect(res.body.data.height).toBeType('number')
        expect(res.body.data.reward).toBeType('number')
        expect(res.body.data.activeDelegates).toBeType('number')
        expect(res.body.data.blocktime).toBeType('number')

        expect(res.body.data.block).toBeType('object')
        expect(res.body.data.block.version).toBeType('number')
        expect(res.body.data.block.maxTransactions).toBeType('number')
        expect(res.body.data.block.maxPayload).toBeType('number')

        expect(res.body.data.epoch).toBeType('string')

        expect(res.body.data.fees).toBeType('object')
        expect(res.body.data.fees.send).toBeType('number')
        expect(res.body.data.fees.vote).toBeType('number')
        expect(res.body.data.fees.secondsignature).toBeType('number')
        expect(res.body.data.fees.delegate).toBeType('number')
        expect(res.body.data.fees.multisignature).toBeType('number')

        done()
      })
    })
  })
})
