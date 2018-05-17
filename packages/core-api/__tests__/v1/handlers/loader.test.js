'use strict'

require('../../__support__/setup')

const utils = require('../utils')

describe('API 1.0 - Loader', () => {
  describe('GET /loader/status', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'loader/status')
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      expect(response.body).toHaveProperty('loaded')
      expect(response.body).toHaveProperty('now')
      expect(response.body).toHaveProperty('blocksCount')
    })
  })

  describe('GET /loader/status/sync', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'loader/status/sync')
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      expect(response.body).toHaveProperty('syncing')
      expect(response.body).toHaveProperty('blocks')
      expect(response.body).toHaveProperty('height')
      expect(response.body).toHaveProperty('id')
    })
  })

  describe('GET /loader/autoconfigure', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'loader/autoconfigure')
      utils.expectSuccessful(response)

      expect(response.body).toBeObject()
      expect(response.body.network).toBeObject()
      expect(response.body.network).toHaveProperty('nethash')
      expect(response.body.network).toHaveProperty('token')
      expect(response.body.network).toHaveProperty('symbol')
      expect(response.body.network).toHaveProperty('explorer')
      expect(response.body.network).toHaveProperty('version')
    })
  })
})
