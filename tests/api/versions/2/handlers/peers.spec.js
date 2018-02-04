const utils = require('../utils')

const peerIp = '167.114.29.32'

describe('API 2.0 - Peers', () => {
  describe('GET /api/peers', () => {
    it('should GET all the peers', (done) => {
      utils.request('GET', 'peers').end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertCollection(res)

        const peer = res.body.data[0]
        expect(peer.ip).toBeType('string')
        expect(peer.port).toBeType('number')
        expect(peer.version).toBeType('string')
        expect(peer.height).toBeType('number')
        expect(peer.status).toBeType('string')
        expect(peer.latency).toBeType('number')

        done()
      })
    })
  })

  describe.skip('GET /api/peers/me', () => {
    it('should GET the current peer', (done) => {
      utils.request('GET', 'peers/me').end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertResource(res)

        expect(res.body.data.ip).toBeType('string')
        expect(res.body.data.port).toBeType('number')
        expect(res.body.data.version).toBeType('string')
        expect(res.body.data.height).toBeType('number')
        expect(res.body.data.status).toBeType('string')
        expect(res.body.data.latency).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/peers/:ip', () => {
    it('should GET a peer by the given ip', (done) => {
      utils.request('GET', `peers/${peerIp}`).end((err, res) => {
        utils.assertSuccessful(err, res)
        utils.assertResource(res)

        expect(res.body.data.ip).toBeType('string')
        expect(res.body.data.port).toBeType('number')
        expect(res.body.data.version).toBeType('string')
        expect(res.body.data.height).toBeType('number')
        expect(res.body.data.status).toBeType('string')
        expect(res.body.data.latency).toBeType('number')

        done()
      })
    })
  })
})
