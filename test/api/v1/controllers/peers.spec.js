const { expect } = require('chai')
const Helpers = require('../helpers')

const peerIp = '167.114.29.55'
const peerPort = '4002'

describe('GET /api/peers/version', () => {
  it('should be ok', (done) => {
    Helpers.request('peers/version').end((err, res) => {
      Helpers.assertSuccessful(err, res)

      expect(res.body.version).to.be.a('string')

      done()
    })
  })
})

describe('GET /api/peers', () => {
  it('using empty parameters should fail', (done) => {
    const params = [
      'state=',
      'os=',
      'shared=',
      'version=',
      'limit=',
      'offset=',
      'orderBy='
    ];

    Helpers.request('peers?' + params.join('&')).end((err, res) => {
      Helpers.assertError(err, res)

      expect(res.body.error).to.be.a('string').contains('should be integer')

      done()
    })
  })

  it('using limit > 100 should fail', (done) => {
    const limit = 101;
    const params = 'limit=' + limit;

    Helpers.request('peers?' + params).end((err, res) => {
      Helpers.assertError(err, res)

      expect(res.body.error).to.be.a('string')

      done()
    })
  })

  it('using invalid parameters should fail', (done) => {
    const params = [
      'state=invalid',
      'os=invalid',
      'shared=invalid',
      'version=invalid',
      'limit=invalid',
      'offset=invalid',
      'orderBy=invalid'
    ];

    Helpers.request('peers?' + params.join('&')).end((err, res) => {
      Helpers.assertError(err, res)

      expect(res.body.error).to.be.a('string')

      done()
    })
  })
})

describe('GET /api/peers/get', () => {
  it('using known ip address with no port should fail', (done) => {
    Helpers.request('peers/get?ip=127.0.0.1').end((err, res) => {
      Helpers.assertError(err, res)

      expect(res.body.error).to.equal('should have required property \'port\'')

      done()
    })
  })

  it('using valid port with no ip address should fail', (done) => {
    Helpers.request('peers/get?port=4002').end((err, res) => {
      Helpers.assertError(err, res)

      expect(res.body.error).to.equal('should have required property \'ip\'')

      done()
    })
  })

  it('using known ip address and port should be ok', (done) => {
    Helpers.request(`peers/get?ip=${peerIp}&port=${peerPort}`).end((err, res) => {
      Helpers.assertSuccessful(err, res)

      expect(res.body.peer).to.be.an('object')

      done()
    })
  })

  it('using unknown ip address and port should fail', (done) => {
    Helpers.request(`peers/get?ip=99.99.99.99&port=${peerPort}`).end((err, res) => {
      Helpers.assertError(err, res)

      expect(res.body.error).to.equal(`Peer 99.99.99.99:${peerPort} not found`)

      done()
    })
  })
})
