'use strict'

const app = require('../../__support__/setup')
const utils = require('../utils')

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 2.0 - Loader', () => {
  describe('GET /node/status', () => {
    it('should GET the node status', async () => {
      const response = await utils.request('GET', 'node/status')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.data.data.synced).toBeBoolean()
      expect(response.data.data.now).toBeNumber()
      expect(response.data.data.blocksCount).toBeNumber()
    })
  })

  describe('GET /node/syncing', () => {
    it('should GET the node syncing status', async () => {
      const response = await utils.request('GET', 'node/syncing')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.data.data.syncing).toBeBoolean()
      expect(response.data.data.blocks).toBeNumber()
      expect(response.data.data.height).toBeNumber()
      expect(response.data.data.id).toBeString()
    })
  })

  describe('GET /node/configuration', () => {
    it('should GET the node configuration', async () => {
      const response = await utils.request('GET', 'node/configuration')
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.data.data.nethash).toBeString()
      expect(response.data.data.token).toBeString()
      expect(response.data.data.symbol).toBeString()
      expect(response.data.data.explorer).toBeString()
      expect(response.data.data.version).toBeNumber()
    })
  })
})
