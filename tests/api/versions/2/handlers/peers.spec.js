const utils = require('../utils')

const peerIp = '167.114.29.32'

describe('API 2.0 - Peers', () => {
  describe('GET /peers', () => {
    it('should GET all the peers', async () => {
      const res = await utils.request('GET', 'peers')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const peer = res.body.data[0]
      await expect(peer.ip).toBeType('string')
      await expect(peer.port).toBeType('number')
      // await expect(peer.version).toBeType('string')
      // await expect(peer.height).toBeType('number')
      await expect(peer.status).toBeType('string')
      await expect(peer.latency).toBeType('number')
    })
  })

  describe('GET /peers/:ip', () => {
    it('should GET a peer by the given ip', async () => {
      const res = await utils.request('GET', `peers/${peerIp}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.ip).toBeType('string')
      await expect(res.body.data.port).toBeType('number')
      // await expect(res.body.data.version).toBeType('string')
      // await expect(res.body.data.height).toBeType('number')
      await expect(res.body.data.status).toBeType('string')
      await expect(res.body.data.latency).toBeType('number')
    })
  })
})
