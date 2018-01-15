const chai = require('chai')
const { expect } = require('chai')
const Helpers = require('../helpers')

const base = 'http://localhost:4003'
const peerIp = '167.114.29.55'
const peerPort = '4002'

describe('GET /api/peers/version', () => {
  it('should be ok', (done) => {
    chai.request(base)
      .get('/api/peers/version')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, true)

        expect(res.body.version).to.be.a('string')
        done()
    })
  })
})

describe('GET /api/peers', () => {
  it('using empty parameters should fail', (done) => {
    var params = [
      'state=',
      'os=',
      'shared=',
      'version=',
      'limit=',
      'offset=',
      'orderBy='
    ];

    chai.request(base)
      .get('/api/peers?' + params.join('&'))
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body.error).to.be.a('string').contains('should be integer')
        done()
    })
  })

  it('using limit > 100 should fail', (done) => {
    var limit = 101;
    var params = 'limit=' + limit;

    chai.request(base)
      .get('/api/peers?' + params)
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body.error).to.be.a('string')

        done()
    })
  })

  it('using invalid parameters should fail', (done) => {
    var params = [
      'state=invalid',
      'os=invalid',
      'shared=invalid',
      'version=invalid',
      'limit=invalid',
      'offset=invalid',
      'orderBy=invalid'
    ];

    chai.request(base)
      .get('/api/peers?' + params.join('&'))
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body.error).to.be.a('string')
        done()
    })
  })
})

describe('GET /api/peers/get', () => {
  it('using known ip address with no port should fail', (done) => {
    chai.request(base)
      .get('/api/peers/get?ip=127.0.0.1')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body.error).to.equal('should have required property \'port\'')
        done()
    })
  })

  it('using valid port with no ip address should fail', (done) => {
    chai.request(base)
      .get('/api/peers/get?port=4002')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body.error).to.equal('should have required property \'ip\'')
        done()
    })
  })

  it('using known ip address and port should be ok', (done) => {
    chai.request(base)
      .get(`/api/peers/get?ip=${peerIp}&port=${peerPort}`)
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, true)

        expect(res.body.peer).to.be.an('object')
        done()
    })
  })

  it('using unknown ip address and port should fail', (done) => {
    chai.request(base)
      .get(`/api/peers/get?ip=99.99.99.99&port=${peerPort}`)
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body.error).to.equal(`Peer 99.99.99.99:${peerPort} not found`)
        done()
    })
  })
})
