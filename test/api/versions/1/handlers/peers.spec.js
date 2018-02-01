const utils = require('../utils')

const peerIp = '167.114.29.55'
const peerPort = '4002'

describe('API 1.0 - Peers', () => {
  describe('GET /api/peers/version', () => {
    it('should be ok', (done) => {
      utils.request('GET', 'peers/version').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.version).toBeType('string')

        done()
      })
    })
  })

  describe('GET /api/peers', () => {
    it('should fail using empty parameters', (done) => {
      utils.request('GET', 'peers', {
        state: null,
        os: null,
        shared: null,
        version: null,
        limit: null,
        offset: null,
        orderBy: null
      }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toContain('should be string')

        done()
      })
    })

    it('should fail using limit > 100', (done) => {
      utils.request('GET', 'peers', { limit: 101 }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error)

        done()
      })
    })

    it('should fail using invalid parameters', (done) => {
      utils.request('GET', 'peers', {
        state: 'invalid',
        os: 'invalid',
        shared: 'invalid',
        version: 'invalid',
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).not.toBeNull()

        done()
      })
    })
  })

  describe('GET /api/peers/get', () => {
    it('should fail using known ip address with no port', (done) => {
      utils.request('GET', 'peers/get?ip=127.0.0.1').end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toBe('should have required property \'port\'')

        done()
      })
    })

    it('should fail using valid port with no ip address', (done) => {
      utils.request('GET', 'peers/get', { port: 4002 }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toBe('should have required property \'ip\'')

        done()
      })
    })

    it('should be ok using known ip address and port', (done) => {
      utils.request('GET', 'peers/get', { ip: peerIp, port: peerPort }).end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.peer).toBeType('object')

        done()
      })
    })

    it('should fail using unknown ip address and port', (done) => {
      utils.request('GET', 'peers/get', { ip: '99.99.99.99', port: peerPort }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toBe(`Peer 99.99.99.99:${peerPort} not found`)

        done()
      })
    })
  })
})
