'use strict'

require('../../__support__/setup')

const utils = require('../utils')

describe('API 1.0 - Loader', () => {
  describe('GET /loader/status', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'loader/status')
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await expect(res.body).toHaveProperty('loaded')
      await expect(res.body).toHaveProperty('now')
      await expect(res.body).toHaveProperty('blocksCount')
    })
  })

  describe('GET /loader/status/sync', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'loader/status/sync')
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await expect(res.body).toHaveProperty('syncing')
      await expect(res.body).toHaveProperty('blocks')
      await expect(res.body).toHaveProperty('height')
      await expect(res.body).toHaveProperty('id')
    })
  })

  describe('GET /loader/autoconfigure', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'loader/autoconfigure')
      await utils.assertSuccessful(res)

      await expect(res.body).toBeObject()
      await expect(res.body.network).toBeObject()
      await expect(res.body.network).toHaveProperty('nethash')
      await expect(res.body.network).toHaveProperty('token')
      await expect(res.body.network).toHaveProperty('symbol')
      await expect(res.body.network).toHaveProperty('explorer')
      await expect(res.body.network).toHaveProperty('version')
    })
  })
})
