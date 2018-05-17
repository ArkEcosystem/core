'use strict'

require('../../__support__/setup')

const utils = require('../utils')

describe('API 2.0 - Loader', () => {
  describe('GET /node/status', () => {
    it('should GET the node status', async () => {
      const response = await utils.request('GET', 'node/status')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data.synced).toBeBoolean()
      expect(response.body.data.now).toBeNumber()
      expect(response.body.data.blocksCount).toBeNumber()
    })
  })

  describe('GET /node/syncing', () => {
    it('should GET the node syncing status', async () => {
      const response = await utils.request('GET', 'node/syncing')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data.syncing).toBeBoolean()
      expect(response.body.data.blocks).toBeNumber()
      expect(response.body.data.height).toBeNumber()
      expect(response.body.data.id).toBeString()
    })
  })

  describe('GET /node/configuration', () => {
    it('should GET the node configuration', async () => {
      const response = await utils.request('GET', 'node/configuration')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data.nethash).toBeString()
      expect(response.body.data.token).toBeString()
      expect(response.body.data.symbol).toBeString()
      expect(response.body.data.explorer).toBeString()
      expect(response.body.data.version).toBeNumber()
    })
  })
})
