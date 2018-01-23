const chai = require('chai')
const { expect } = require('chai')
const Helpers = require('../helpers')

describe('GET api/signatures', () => {
  it('should successfully send the request', (done) => {
    Helpers.request('signatures').end((err, res) => {
        Helpers.assertError(err, res, 501)

        done()
      })
  })
})
