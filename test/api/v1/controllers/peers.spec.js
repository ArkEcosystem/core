const Helpers = require('../helpers')

const peerIp = '167.114.29.55'
const peerPort = '4002'

describe('API 1.0 - Peers', () => {
  describe('GET /api/peers/version', () => {
    it('should be ok', (done) => {
      Helpers.request('GET', 'peers/version').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('version').which.is.a('string')

        done()
      })
    })
  })

  describe('GET /api/peers', () => {
    it('using empty parameters should fail', (done) => {
      Helpers.request('GET', 'peers', {
        state: null,
        os: null,
        shared: null,
        version: null,
        limit: null,
        offset: null,
        orderBy: null
      }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.is.a('string').and.contains('should be integer')

        done()
      })
    })

    it('using limit > 100 should fail', (done) => {
      Helpers.request('GET', 'peers', { limit: 101 }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.is.a('string')

        done()
      })
    })

    it('using invalid parameters should fail', (done) => {
      Helpers.request('GET', 'peers', {
        state: 'invalid',
        os: 'invalid',
        shared: 'invalid',
        version: 'invalid',
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.is.a('string')

        done()
      })
    })
  })

  describe('GET /api/peers/get', () => {
    it('should fail using known ip address with no port', (done) => {
      Helpers.request('GET', 'peers/get?ip=127.0.0.1').end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.equals('should have required property \'port\'')

        done()
      })
    })

    it('should fail using valid port with no ip address', (done) => {
      Helpers.request('GET', 'peers/get', { port: 4002 }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.equals('should have required property \'ip\'')

        done()
      })
    })

    it('should be ok using known ip address and port', (done) => {
      Helpers.request('GET', 'peers/get', { ip: peerIp, port: peerPort }).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('peer').which.is.an('object')

        done()
      })
    })

    it('should fail using unknown ip address and port', (done) => {
      Helpers.request('GET', 'peers/get', { ip: '99.99.99.99', port: peerPort }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error').which.equals(`Peer 99.99.99.99:${peerPort} not found`)

        done()
      })
    })
  })
})
