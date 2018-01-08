const chai = require('chai')
const { expect } = require('chai')

let base = 'http://localhost:4003'

let dAddressActive = 'DRac35wghMcmUSe5jDMLBDLWkVVjyKZFxK'
let dAddressCold = 'DCs3EeTAME7W61fx5YiJKe9nhWn61YpRMJ'

describe('GET api/accounts/?address', () => {
  it('should return account/wallet information', () => {
    chai.request(base)
      .get(`/api/accounts/?address=${dAddressActive}`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(true)
        expect(res.body.account).to.have.all.keys(['address','publicKey','secondPublicKey','vote','username','balance','votebalance'])
        expect(res.body.account.vote).to.be.a('string')
        expect(res.body.account.balance).to.be.a('number')
        expect(res.body.account.votebalance).to.be.a('number')
        expect(res.body.account.address).to.be.a('string')
        expect(res.body.account.publicKey).to.be.a('string')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })

  it('should return error with Not Found', () => {
    chai.request(base)
      .get(`/api/accounts/?address=${dAddressCold}`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.error).to.be.a('string').contains('Not found')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })
})

describe('GET api/accounts/getBalance?address', () => {
  it('should return balance', () => {
    chai.request(base)
      .get(`/api/accounts/getBalance?address=${dAddressActive}`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.equal(true)
        expect(res.body.balance).to.be.a('number')
        expect(res.body.unconfirmedBalance).to.be.a('number')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })

  it('should return info not existing address', () => {
    chai.request(base)
      .get(`/api/accounts/getBalance?address=${dAddressCold}`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.equal(false)
        expect(res.body.error).to.be.a('string').contains('Notw found')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })
})

describe('GET /api/accounts/getPublicKey?address', () => {
  it('should return public key for address', () => {
    chai.request(base)
      .get(`/api/accounts/getPublicKey?address=${dAddressActive}`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.equal(true)
        expect(res.body.publicKey).to.be.a('string')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })

  it('should return info not existing address', () => {
    chai.request(base)
      .get(`/api/accounts/getPublicKey?address=${dAddressCold}`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.equal(false)
        expect(res.body.error).to.be.a('string').contains('Not found')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })
})

describe('GET /api/accounts/delegates?address', () => {
  it('should return delegate info the address has voted for', () => {
    chai.request(base)
      .get(`/api/accounts/delegates?address=${dAddressActive}`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(true)
        expect(res.body.delegates).to.be.an('array')
        expect(res.body.delegates[0].producedblocks).to.be.a('number')
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })

  it('should return info that the address is not found', () => {
    chai.request(base)
      .get(`/api/accounts/delegates?address=${dAddressCold}`)
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.success).to.be.equal(false)
        expect(res.body.error).to.be.a('string').contains(`Address not found.`)
        expect(res.body.meta.matchedVersion).to.equal('1.0.0')
      })
  })
})


