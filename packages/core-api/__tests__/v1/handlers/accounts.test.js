'use strict'

require('../../__support__/setup')

const utils = require('../utils')

const address = 'AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo'

describe('API 1.0 - Wallets', () => {
  describe('GET api/accounts/?address', () => {
    it('should return account information', async () => {
      const res = await utils.request('GET', 'accounts', { address })
      await utils.assertSuccessful(res)

      const expected = ['address', 'publicKey', 'secondPublicKey', 'vote', 'username', 'balance', 'votebalance']
      await expect(Object.keys(res.body.account)).toEqual(expect.arrayContaining(expected))
    })
  })

  describe('GET api/accounts/getBalance?address', () => {
    it('should return balance', async () => {
      const res = await utils.request('GET', 'accounts/getBalance', { address })
      await utils.assertSuccessful(res)

      await expect(res.body.balance).toBeNumber()
      await expect(res.body.unconfirmedBalance).toBeNumber()
    })
  })

  describe('GET /accounts/getPublicKey?address', () => {
    it('should return public key for address', async () => {
      const res = await utils.request('GET', 'accounts/getPublicKey', { address })
      await utils.assertSuccessful(res)

      await expect(res.body.publicKey).toBeString()
    })
  })

  describe('GET /accounts/delegates?address', () => {
    it('should return delegate info the address has voted for', async () => {
      const res = await utils.request('GET', 'accounts/delegates', { address })
      await utils.assertSuccessful(res)

      await expect(res.body.delegates).toBeArray()
      await expect(res.body.delegates[0].producedblocks).toBeNumber()
    })
  })
})
