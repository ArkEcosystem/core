const { expect } = require('chai')
const Helpers = require('../helpers')

describe('GET /api/signatures/fee', () => {
  it('should return second signature value from config', (done) => {
    Helpers.request('signatures/fee').end((err, res) => {
      Helpers.assertSuccessful(err, res)

      expect(res.body.fee).to.be.a('number')

      done()
    })
  })
})
