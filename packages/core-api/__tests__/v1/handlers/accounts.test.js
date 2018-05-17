'use strict'

require('../../__support__/setup')

const utils = require('../utils')

const address = 'AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo'

describe('API 1.0 - Wallets', () => {
  describe('GET api/accounts/?address', () => {
    it('should return account information', async () => {
      const response = await utils.request('GET', 'accounts', { address })
      utils.expectSuccessful(response)

      const expected = ['address', 'publicKey', 'secondPublicKey', 'votes', 'username', 'balance', 'votebalance']
      expect(Object.keys(response.body.account)).toEqual(expect.arrayContaining(expected))
    })
  })

  describe('GET api/accounts/getBalance?address', () => {
    it('should return balance', async () => {
      const response = await utils.request('GET', 'accounts/getBalance', { address })
      utils.expectSuccessful(response)

      expect(response.body.balance).toBeNumber()
      expect(response.body.unconfirmedBalance).toBeNumber()
    })
  })

  describe('GET /accounts/getPublicKey?address', () => {
    it('should return public key for address', async () => {
      const response = await utils.request('GET', 'accounts/getPublicKey', { address })
      utils.expectSuccessful(response)

      expect(response.body.publicKey).toBeString()
    })
  })

  describe('GET /accounts/delegates?address', () => {
    it('should return delegate info the address has voted for', async () => {
      const response = await utils.request('GET', 'accounts/delegates', { address })
      utils.expectSuccessful(response)

      expect(response.body.delegates).toBeArray()
      expect(response.body.delegates[0].producedblocks).toBeNumber()
    })
  })
})
