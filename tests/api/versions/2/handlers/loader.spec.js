const utils = require('../utils')

describe('API 2.0 - Loader', () => {
  describe('GET /loader/status', () => {
    it('should GET the loader status', async () => {
      const res = await utils.request('GET', 'loader/status')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.loaded).toBeType('boolean')
      await expect(res.body.data.now).toBeType('number')
      // await expect(res.body.data.blocksCount).toBeType('number')
    })
  })

  describe('GET /loader/syncing', () => {
    it('should GET the loader syncing status', async () => {
      const res = await utils.request('GET', 'loader/syncing')
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.syncing).toBeType('boolean')
      await expect(res.body.data.blocks).toBeType('number')
      await expect(res.body.data.height).toBeType('number')
      await expect(res.body.data.id).toBeType('string')
    })
  })

  describe('GET /loader/configuration', () => {
    it('should GET the loader configuration', async () => {
      const res = await utils.request('GET', 'loader/configuration')
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
