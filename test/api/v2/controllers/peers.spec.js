const Helpers = require('../helpers')

const peerIp = '167.114.29.32'

describe('API 2.0 - Peers', () => {
  describe('GET /api/peers', () => {
    it('should GET all the peers', (done) => {
      Helpers.request('GET', 'peers').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        const peer = res.body.data[0]
        peer.should.have.property('ip').which.is.a('string')
        peer.should.have.property('port').which.is.a('number')
        peer.should.have.property('version').which.is.a('string')
        peer.should.have.property('height').which.is.a('number')
        peer.should.have.property('status').which.is.a('string')
        peer.should.have.property('latency').which.is.a('number')

        done()
      })
    })
  })

  describe.skip('GET /api/peers/me', () => {
    it('should GET the current peer', (done) => {
      Helpers.request('GET', 'peers/me').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('ip').which.is.a('string')
        res.body.data.should.have.property('port').which.is.a('number')
        res.body.data.should.have.property('version').which.is.a('string')
        res.body.data.should.have.property('height').which.is.a('number')
        res.body.data.should.have.property('status').which.is.a('string')
        res.body.data.should.have.property('latency').which.is.a('number')

        done()
      })
    })
  })

  describe('GET /api/peers/:ip', () => {
    it('should GET a peer by the given ip', (done) => {
      Helpers.request('GET', `peers/${peerIp}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('ip').which.is.a('string')
        res.body.data.should.have.property('port').which.is.a('number')
        res.body.data.should.have.property('version').which.is.a('string')
        res.body.data.should.have.property('height').which.is.a('number')
        res.body.data.should.have.property('status').which.is.a('string')
        res.body.data.should.have.property('latency').which.is.a('number')

        done()
      })
    })
  })
})
