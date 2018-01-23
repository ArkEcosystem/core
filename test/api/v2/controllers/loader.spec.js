const chai = require('chai')
const { expect } = require('chai')
const Helpers = require('../helpers')

describe('GET api/loader/status', () => {
  it('should successfully send the request', (done) => {
    Helpers.request('loader/status').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        expect(res.body.data).to.be.a('object')

        done()
      })
  })
})
