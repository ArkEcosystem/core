'use strict'

require('../../__support__/setup')

const utils = require('../utils')

describe('API 2.0 - Loader', () => {
  describe('GET /node/status', () => {
    it('should GET the node status', async () => {
      const res = await utils.request('GET', 'node/status')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.synced).toBeBoolean()
      await expect(res.body.data.now).toBeNumber()
      await expect(res.body.data.blocksCount).toBeNumber()
    })
  })

  describe('GET /node/syncing', () => {
    it('should GET the node syncing status', async () => {
      const res = await utils.request('GET', 'node/syncing')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.syncing).toBeBoolean()
      await expect(res.body.data.blocks).toBeNumber()
      await expect(res.body.data.height).toBeNumber()
      await expect(res.body.data.id).toBeString()
    })
  })

  describe('GET /node/configuration', () => {
    it('should GET the node configuration', async () => {
      const res = await utils.request('GET', 'node/configuration')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.nethash).toBeString()
      await expect(res.body.data.token).toBeString()
      await expect(res.body.data.symbol).toBeString()
      await expect(res.body.data.explorer).toBeString()
      await expect(res.body.data.version).toBeNumber()
    })
  })
})
