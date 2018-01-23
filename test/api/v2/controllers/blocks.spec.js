const chai = require('chai')
const { expect } = require('chai')
const Helpers = require('../helpers')

describe('GET api/blocks', () => {
  it('should successfully send the request', (done) => {
    Helpers.request('blocks').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        expect(res.body.data).to.be.a('object')

        done()
      })
  })
})
