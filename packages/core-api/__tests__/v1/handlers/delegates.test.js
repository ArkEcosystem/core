'use strict'

require('../../__support__/setup')

const utils = require('../utils')

describe('API 1.0 - Delegates', () => {
  describe('GET /delegates', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'delegates')
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await utils.assertDelegate(res.body.delegates[0])
    })
  })

  describe('GET /delegates/get', () => {
    it('should be ok using a username', async () => {
      const res = await utils.request('GET', 'delegates/get', { username: 'genesis_9' })
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await utils.assertDelegate(res.body.delegate)
    })

    it('should be ok using a publicKey', async () => {
      const res = await utils.request('GET', 'delegates/get', {
        publicKey: '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
      })
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await utils.assertDelegate(res.body.delegate)
    })
  })

  describe('GET /delegates/count', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'delegates/count')
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await expect(res.body).toHaveProperty('count')
    })
  })

  describe('GET /delegates/search', () => {
    it('should be ok searching a username', async () => {
      const res = await utils.request('GET', 'delegates/search', {
        q: 'genesis_9'
      })
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await utils.assertDelegate(res.body.delegates[0])
      await expect(res.body.delegates[0].username).toBe('genesis_9')
    })
  })

  describe('GET /delegates/voters', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'delegates/voters', {
        publicKey: '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
      })
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await utils.assertWallet(res.body.accounts[0])
    })
  })

  describe('GET /delegates/fee', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'delegates/fee')
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await expect(res.body).toHaveProperty('fee')
    })
  })

  describe.skip('GET /delegates/forging/getForgedByAccount', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'delegates/forging/getForgedByAccount', {
        generatorPublicKey: '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
      })
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await expect(res.body).toHaveProperty('fees')
      await expect(res.body).toHaveProperty('rewards')
      await expect(res.body).toHaveProperty('forged')
    })
  })
})
