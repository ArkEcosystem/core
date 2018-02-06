const utils = require('../utils')

describe('API 1.0 - Signatures', () => {
  describe('GET /api/signatures/fee', () => {
    it('should return second signature value from config', (done) => {
      utils.request('GET', 'signatures/fee').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.fee).toBeType('number')

        done()
      })
    })
  })
})
