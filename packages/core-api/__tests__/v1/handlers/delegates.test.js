'use strict'

const app = require('../../__support__/setup')
const utils = require('../utils')

const delegate = {
  username: 'genesis_9',
  publicKey: '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
}

beforeAll(async () => {
  await app.setUp({})
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 1.0 - Delegates', () => {
  describe('GET /delegates', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'delegates')
      utils.expectSuccessful(response)

      expect(response.data).toBeObject()
      utils.expectDelegate(response.data.delegates[0])
    })
  })

  describe('GET /delegates/get', () => {
    it('should be ok using a username', async () => {
      const response = await utils.request('GET', 'delegates/get', { username: delegate.username })
      utils.expectSuccessful(response)

      expect(response.data).toBeObject()
      utils.expectDelegate(response.data.delegate, delegate)
    })

    it('should be ok using a publicKey', async () => {
      const response = await utils.request('GET', 'delegates/get', { publicKey: delegate.publicKey })
      utils.expectSuccessful(response)

      expect(response.data).toBeObject()
      utils.expectDelegate(response.data.delegate, delegate)
    })
  })

  describe('GET /delegates/count', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'delegates/count')
      utils.expectSuccessful(response)

      expect(response.data).toBeObject()
      expect(response.data).toHaveProperty('count')
      expect(response.data.count).toBeNumber()
    })
  })

  describe('GET /delegates/search', () => {
    it('should be ok searching a username', async () => {
      const response = await utils.request('GET', 'delegates/search', { q: delegate.username })
      utils.expectSuccessful(response)

      expect(response.data).toBeObject()
      utils.expectDelegate(response.data.delegates[0], delegate)
    })

    // TODO when the DelegatesRepository#search method admits more parameters
    xit('should not search using other parameters (V2)', () => {
    })
  })

  describe('GET /delegates/voters', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'delegates/voters', { publicKey: delegate.publicKey })
      utils.expectSuccessful(response)

      expect(response.data).toBeObject()
      utils.expectWallet(response.data.accounts[0])
    })
  })

  describe('GET /delegates/fee', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'delegates/fee')
      utils.expectSuccessful(response)

      expect(response.data).toBeObject()
      expect(response.data).toHaveProperty('fee')
      expect(response.data.fee).toBeNumber()
    })
  })

  describe.skip('GET /delegates/forging/getForgedByAccount', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'delegates/forging/getForgedByAccount', {
        generatorPublicKey: delegate.publicKey
      })
      utils.expectSuccessful(response)

      expect(response.data).toBeObject()
      expect(response.data).toHaveProperty('fees')
      expect(response.data).toHaveProperty('rewards')
      expect(response.data).toHaveProperty('forged')
    })
  })
})
