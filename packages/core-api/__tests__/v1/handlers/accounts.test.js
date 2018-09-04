'use strict'

const app = require('../../__support__/setup')
const utils = require('../utils')

const address = 'AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo'

beforeAll(async () => {
  await app.setUp({})
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 1.0 - Wallets', () => {
  describe('GET api/accounts/getAllAccounts', () => {
    it('should return all the wallets', async () => {
      const response = await utils.request('GET', 'accounts/getAllAccounts')
      utils.expectSuccessful(response)

      expect(response.data.accounts).toBeArray()
    })
  })

  describe('GET api/accounts/?address', () => {
    it('should return account information', async () => {
      const response = await utils.request('GET', 'accounts', { address })
      utils.expectSuccessful(response)

      utils.expectWallet(response.data.account)
    })
  })

  describe('GET api/accounts/getBalance?address', () => {
    it('should return balance', async () => {
      const response = await utils.request('GET', 'accounts/getBalance', { address })
      utils.expectSuccessful(response)

      expect(response.data.balance).toBeString()
      expect(response.data.unconfirmedBalance).toBeString()
    })
  })

  describe('GET /accounts/getPublicKey?address', () => {
    it('should return public key for address', async () => {
      const response = await utils.request('GET', 'accounts/getPublicKey', { address })
      utils.expectSuccessful(response)

      expect(response.data.publicKey).toBeString()
    })
  })

  describe('GET api/accounts/delegates/fee', () => {
    it('should return delegate fee of an account', async () => {
      const response = await utils.request('GET', 'accounts/delegates/fee')
      utils.expectSuccessful(response)

      expect(response.data.fee).toBeNumber()
    })
  })

  describe('GET /accounts/delegates?address', () => {
    it('should return delegate info the address has voted for', async () => {
      const response = await utils.request('GET', 'accounts/delegates', { address })
      utils.expectSuccessful(response)

      expect(response.data.delegates).toBeArray()
      expect(response.data.delegates[0].producedblocks).toBeNumber()
    })
  })

  describe('GET api/accounts/top', () => {
    it('should return the top wallets', async () => {
      const response = await utils.request('GET', 'accounts/top')
      utils.expectSuccessful(response)

      expect(response.data.accounts).toBeArray()
    })
  })

  describe('GET api/accounts/count', () => {
    it('should return the total number of wallets', async () => {
      const response = await utils.request('GET', 'accounts/count')
      utils.expectSuccessful(response)

      expect(response.data.count).toBeNumber()
    })
  })
})
