const utils = require('../utils')

const peerIp = '167.114.29.55'
const peerPort = '4002'

describe('API 1.0 - Peers', () => {
  describe('GET /api/peers/version', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'peers/version')
      await utils.assertSuccessful(res)

      await expect(res.body.version).toBeType('string')
    })
  })

  describe('GET /api/peers', () => {
    it('should fail using empty parameters', async () => {
      const res = await utils.request('GET', 'peers', {
        state: null,
        os: null,
        shared: null,
        version: null,
        limit: null,
        offset: null,
        orderBy: null
      })
      await utils.assertError(res)

      await expect(res.body.error).toContain('should be string')
    })

    it('should fail using limit > 100', async () => {
      const res = await utils.request('GET', 'peers', { limit: 101 })
      await utils.assertError(res)

      await expect(res.body.error)
    })

    it('should fail using invalid parameters', async () => {
      const res = await utils.request('GET', 'peers', {
        state: 'invalid',
        os: 'invalid',
        shared: 'invalid',
        version: 'invalid',
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      })
      await utils.assertError(res)

      await expect(res.body.error).not.toBeNull()
    })
  })

  describe('GET /api/peers/get', () => {
    it('should fail using known ip address with no port', async () => {
      const res = await utils.request('GET', 'peers/get?ip=127.0.0.1')
      await utils.assertError(res)

      await expect(res.body.error).toBe('should have required property \'port\'')
    })

    it('should fail using valid port with no ip address', async () => {
      const res = await utils.request('GET', 'peers/get', { port: 4002 })
      await utils.assertError(res)

      await expect(res.body.error).toBe('should have required property \'ip\'')
    })

    it('should be ok using known ip address and port', async () => {
      const res = await utils.request('GET', 'peers/get', { ip: peerIp, port: peerPort })
      await utils.assertSuccessful(res)

      await expect(res.body.peer).toBeType('object')
    })

    it('should fail using unknown ip address and port', async () => {
      const res = await utils.request('GET', 'peers/get', { ip: '99.99.99.99', port: peerPort })
      await utils.assertError(res)

      await expect(res.body.error).toBe(`Peer 99.99.99.99:${peerPort} not found`)
    })
  })
})
