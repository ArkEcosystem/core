const chai = require('chai')
const { expect } = require('chai')
const Helpers = require('../helpers')

const base = 'http://localhost:4003'

describe('GET /api/signatures/fee', () => {
  it('should return second signature value from config', (done) => {
    chai.request(base)
      .get('/api/signatures/fee')
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, true)

        expect(res.body.fee).to.be.a('number')
        done()
    })
  })
})
