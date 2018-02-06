const utils = require('../utils')

const AddressActive = 'DRac35wghMcmUSe5jDMLBDLWkVVjyKZFxK'
const AddressCold = 'DCs3EeTAME7W61fx5YiJKe9nhWn61YpRMJ'

describe('API 1.0 - Wallets', () => {
  describe('GET api/accounts/?address', () => {
    it('should return account information', (done) => {
      utils.request('GET', 'accounts', { address: AddressActive }).end((err, res) => {
        utils.assertSuccessful(err, res)

        const expected = ['address', 'publicKey', 'secondPublicKey', 'vote', 'username', 'balance', 'votebalance']
        expect(Object.keys(res.body.account)).toEqual(expect.arrayContaining(expected))

        expect(res.body.account.vote).toBeType('string')
        expect(res.body.account.balance).toBeType('number')
        expect(res.body.account.votebalance).toBeType('number')
        expect(res.body.account.address).toBeType('string')
        expect(res.body.account.publicKey).toBeType('string')

        done()
      })
    })

    it('should return error with Not Found', (done) => {
      utils.request('GET', 'accounts', { address: AddressCold }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toContain('Not found')

        done()
      })
    })
  })

  describe('GET api/accounts/getBalance?address', () => {
    it('should return balance', (done) => {
      utils.request('GET', 'accounts/getBalance', { address: AddressActive }).end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.balance).toBeType('number')
        expect(res.body.unconfirmedBalance).toBeType('number')

        done()
      })
    })

    it('should return info not existing address', (done) => {
      utils.request('GET', 'accounts/getBalance', { address: AddressCold }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toContain('Not found')

        done()
      })
    })
  })

  describe('GET /api/accounts/getPublicKey?address', () => {
    it('should return public key for address', (done) => {
      utils.request('GET', 'accounts/getPublicKey', { address: AddressActive }).end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.publicKey).toBeType('string')

        done()
      })
    })

    it('should return info not existing address', (done) => {
      utils.request('GET', 'accounts/getPublicKey', { address: AddressCold }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toContain('Not found')

        done()
      })
    })
  })

  describe('GET /api/accounts/delegates?address', () => {
    it('should return delegate info the address has voted for', (done) => {
      utils.request('GET', 'accounts/delegates', { address: AddressActive }).end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(Array.isArray(res.body.delegates)).toBe(true)
        expect(res.body.delegates[0].producedblocks).toBeType('number')

        done()
      })
    })

    it('should return info that the address is not found', (done) => {
      utils.request('GET', 'accounts/delegates', { address: AddressCold }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toContain('Address not found.')

        done()
      })
    })
  })
})
