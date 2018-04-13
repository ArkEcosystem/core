const utils = require('../utils')

describe('API 2.0 - Loader', () => {
  describe('GET /node/status', () => {
    it('should GET the node status', async () => {
      const res = await utils.request('GET', 'node/status')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.loaded).toBeType('boolean')
      await expect(res.body.data.now).toBeType('number')
      // await expect(res.body.data.blocksCount).toBeType('number')
    })
  })

  describe('GET /node/syncing', () => {
    it('should GET the node syncing status', async () => {
      const res = await utils.request('GET', 'node/syncing')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.syncing).toBeType('boolean')
      await expect(res.body.data.blocks).toBeType('number')
      await expect(res.body.data.height).toBeType('number')
      await expect(res.body.data.id).toBeType('string')
    })
  })

  describe('GET /node/configuration', () => {
    it('should GET the node configuration', async () => {
      const res = await utils.request('GET', 'node/configuration')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.nethash).toBeType('string')
      await expect(res.body.data.token).toBeType('string')
      await expect(res.body.data.symbol).toBeType('string')
      await expect(res.body.data.explorer).toBeType('string')
      await expect(res.body.data.version).toBeType('number')
    })
  })
})
