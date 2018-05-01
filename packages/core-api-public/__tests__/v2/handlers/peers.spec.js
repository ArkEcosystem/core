'use strict'

beforeAll(async (done) => {
  await require('../../__support__/setup')()

  done()
})

const utils = require('../utils')

const peerIp = '167.114.29.32'

describe('API 2.0 - Peers', () => {
  describe('GET /peers', () => {
    it('should GET all the peers', async () => {
      const res = await utils.request('GET', 'peers')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const peer = res.body.data[0]
      await expect(peer.ip).toBeString()
      await expect(peer.port).toBeNumber()
      // await expect(peer.version).toBeString()
      // await expect(peer.height).toBeNumber()
      await expect(peer.status).toBeString()
      await expect(peer.latency).toBeNumber()
    })
  })

  describe('GET /peers/:ip', () => {
    it('should GET a peer by the given ip', async () => {
      const res = await utils.request('GET', `peers/${peerIp}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.ip).toBeString()
      await expect(res.body.data.port).toBeNumber()
      // await expect(res.body.data.version).toBeString()
      // await expect(res.body.data.height).toBeNumber()
      await expect(res.body.data.status).toBeString()
      await expect(res.body.data.latency).toBeNumber()
    })
  })
})
