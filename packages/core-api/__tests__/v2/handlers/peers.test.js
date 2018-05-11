'use strict'

require('../../__support__/setup')

const utils = require('../utils')

const peerIp = '167.114.29.32'

describe('API 2.0 - Peers', () => {
  describe('GET /peers', () => {
    it('should GET all the peers', async () => {
      const res = await utils.request('GET', 'peers')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data[0]).toBeObject()
    })
  })

  describe('GET /peers/:ip', () => {
    it('should GET a peer by the given ip', async () => {
      const res = await utils.request('GET', `peers/${peerIp}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data).toBeObject()
    })
  })
})
