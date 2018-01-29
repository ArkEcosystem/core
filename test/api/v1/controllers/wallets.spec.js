const Helpers = require('../helpers')

const AddressActive = 'DRac35wghMcmUSe5jDMLBDLWkVVjyKZFxK'
const AddressCold = 'DCs3EeTAME7W61fx5YiJKe9nhWn61YpRMJ'

describe('API 1.0 - Wallets', () => {
  describe('GET api/wallets/?address', () => {
    it('should return wallet/wallet information', (done) => {
      Helpers.request('GET', 'wallets', { address: AddressActive }).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('wallet').which.has.all.keys(['address', 'publicKey', 'secondPublicKey', 'vote', 'username', 'balance', 'votebalance'])
        res.body.wallet.should.have.property('vote').which.is.a('string')
        res.body.wallet.should.have.property('balance').which.is.a('number')
        res.body.wallet.should.have.property('votebalance').which.is.a('number')
        res.body.wallet.should.have.property('address').which.is.a('string')
        res.body.wallet.should.have.property('publicKey').which.is.a('string')

        done()
      })
    })

    it('should return error with Not Found', (done) => {
      Helpers.request('GET', 'wallets', { address: AddressCold }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.is.a('string').and.contains('Not found')

        done()
      })
    })
  })

  describe('GET api/wallets/getBalance?address', () => {
    it('should return balance', (done) => {
      Helpers.request('GET', 'wallets/getBalance', { address: AddressActive }).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('balance').which.is.a('number')
        res.body.should.have.property('unconfirmedBalance').which.is.a('number')

        done()
      })
    })

    it('should return info not existing address', (done) => {
      Helpers.request('GET', 'wallets/getBalance', { address: AddressCold }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.is.a('string').and.contains('Not found')

        done()
      })
    })
  })

  describe('GET /api/wallets/getPublicKey?address', () => {
    it('should return public key for address', (done) => {
      Helpers.request('GET', 'wallets/getPublicKey', { address: AddressActive }).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('publicKey').which.is.a('string')

        done()
      })
    })

    it('should return info not existing address', (done) => {
      Helpers.request('GET', 'wallets/getPublicKey', { address: AddressCold }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.is.a('string').and.contains('Not found')

        done()
      })
    })
  })

  describe('GET /api/wallets/delegates?address', () => {
    it('should return delegate info the address has voted for', (done) => {
      Helpers.request('GET', 'wallets/delegates', { address: AddressActive }).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('delegates').which.is.an('array')
        res.body.delegates[0].should.have.property('producedblocks').which.is.a('number')

        done()
      })
    })

    it('should return info that the address is not found', (done) => {
      Helpers.request('GET', 'wallets/delegates', { address: AddressCold }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.is.a('string').and.contains('Address not found.')

        done()
      })
    })
  })
})
