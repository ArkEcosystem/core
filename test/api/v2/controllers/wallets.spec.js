const chai = require('chai')
const { expect } = require('chai')
const Helpers = require('../helpers')

const AddressActive = 'DRac35wghMcmUSe5jDMLBDLWkVVjyKZFxK'
const AddressCold = 'DCs3EeTAME7W61fx5YiJKe9nhWn61YpRMJ'

describe('GET api/wallets/:address', () => {
  it('should return account/wallet information', (done) => {
    Helpers.request(`wallets/${AddressActive}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        expect(res.body).to.be.a('object')

        done()
      })
  })

  it('should return error with Not Found', (done) => {
    Helpers.request(`wallets/${AddressCold}`).end((err, res) => {
        Helpers.assertError(err, res)

        expect(res.body.code).to.be.a('string').eq('ResourceNotFound')

        done()
      })
  })
})
