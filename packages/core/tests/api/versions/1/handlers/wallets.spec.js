const utils = require('../utils')

const AddressActive = 'DRac35wghMcmUSe5jDMLBDLWkVVjyKZFxK'
const AddressCold = 'DCs3EeTAME7W61fx5YiJKe9nhWn61YpRMJ'

describe('API 1.0 - Wallets', () => {
  describe('GET api/accounts/?address', () => {
    it('should return account information', async () => {
      const res = await utils.request('GET', 'accounts', { address: AddressActive })
      await utils.assertSuccessful(res)

      const expected = ['address', 'publicKey', 'secondPublicKey', 'vote', 'username', 'balance', 'votebalance']
      await expect(Object.keys(res.body.account)).toEqual(expect.arrayContaining(expected))

      await expect(res.body.account.vote).toBeType('string')
      await expect(res.body.account.balance).toBeType('number')
      await expect(res.body.account.votebalance).toBeType('number')
      await expect(res.body.account.address).toBeType('string')
      await expect(res.body.account.publicKey).toBeType('string')
    })

    it('should return error with Not Found', async () => {
      const res = await utils.request('GET', 'accounts', { address: AddressCold })
      await utils.assertError(res)

      await expect(res.body.error).toContain('Not found')
    })
  })

  describe('GET api/accounts/getBalance?address', () => {
    it('should return balance', async () => {
      const res = await utils.request('GET', 'accounts/getBalance', { address: AddressActive })
      await utils.assertSuccessful(res)

      await expect(res.body.balance).toBeType('number')
      await expect(res.body.unconfirmedBalance).toBeType('number')
    })

    it('should return info not existing address', async () => {
      const res = await utils.request('GET', 'accounts/getBalance', { address: AddressCold })
      await utils.assertError(res)

      await expect(res.body.error).toContain('Not found')
    })
  })

  describe('GET /accounts/getPublicKey?address', () => {
    it('should return public key for address', async () => {
      const res = await utils.request('GET', 'accounts/getPublicKey', { address: AddressActive })
      await utils.assertSuccessful(res)

      await expect(res.body.publicKey).toBeType('string')
    })

    it('should return info not existing address', async () => {
      const res = await utils.request('GET', 'accounts/getPublicKey', { address: AddressCold })
      await utils.assertError(res)

      await expect(res.body.error).toContain('Not found')
    })
  })

  describe('GET /accounts/delegates?address', () => {
    it('should return delegate info the address has voted for', async () => {
      const res = await utils.request('GET', 'accounts/delegates', { address: AddressActive })
      await utils.assertSuccessful(res)

      await expect(Array.isArray(res.body.delegates)).toBe(true)
      await expect(res.body.delegates[0].producedblocks).toBeType('number')
    })

    it('should return info that the address is not found', async () => {
      const res = await utils.request('GET', 'accounts/delegates', { address: AddressCold })
      await utils.assertError(res)

      await expect(res.body.error).toContain('Address not found.')
    })
  })
})
