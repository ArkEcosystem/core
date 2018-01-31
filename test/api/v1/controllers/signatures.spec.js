const Helpers = require('../helpers')

describe('API 1.0 - Signatures', () => {
  describe('GET /api/signatures/fee', () => {
    it('should return second signature value from config', (done) => {
      Helpers.request('GET', 'signatures/fee').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        expect(res.body.fee).toBeType('number')

        done()
      })
    })
  })
})
