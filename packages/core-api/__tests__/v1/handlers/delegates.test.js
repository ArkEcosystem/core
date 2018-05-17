'use strict'

require('../../__support__/setup')

const utils = require('../utils')

describe('API 1.0 - Delegates', () => {
  describe('GET /delegates', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'delegates')
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      utils.expectDelegate(response.body.delegates[0])
    })
  })

  describe('GET /delegates/get', () => {
    it('should be ok using a username', async () => {
      const response = await utils.request('GET', 'delegates/get', { username: 'genesis_9' })
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      utils.expectDelegate(response.body.delegate)
    })

    it('should be ok using a publicKey', async () => {
      const response = await utils.request('GET', 'delegates/get', {
        publicKey: '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
      })
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      utils.expectDelegate(response.body.delegate)
    })
  })

  describe('GET /delegates/count', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'delegates/count')
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      expect(response.body).toHaveProperty('count')
    })
  })

  describe('GET /delegates/search', () => {
    it('should be ok searching a username', async () => {
      const response = await utils.request('GET', 'delegates/search', {
        q: 'genesis_9'
      })
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      utils.expectDelegate(response.body.delegates[0])
      expect(response.body.delegates[0].username).toBe('genesis_9')
    })
  })

  describe('GET /delegates/voters', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'delegates/voters', {
        publicKey: '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
      })
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      utils.expectWallet(response.body.accounts[0])
    })
  })

  describe('GET /delegates/fee', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'delegates/fee')
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      expect(response.body).toHaveProperty('fee')
    })
  })

  describe.skip('GET /delegates/forging/getForgedByAccount', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'delegates/forging/getForgedByAccount', {
        generatorPublicKey: '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
      })
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      expect(response.body).toHaveProperty('fees')
      expect(response.body).toHaveProperty('rewards')
      expect(response.body).toHaveProperty('forged')
    })
  })
})
