const chai = require('chai')
const { expect } = require('chai')
const Helpers = require('../helpers')

describe('GET api/multisignatures', () => {
  it('should successfully send the request', (done) => {
    Helpers.request('multisignatures').end((err, res) => {
        Helpers.assertError(err, res, 501)

        done()
      })
  })
})
