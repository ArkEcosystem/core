const node = require('../support/node')

xdescribe('GET /peer/list', function () {

  // FIXME
  before(function (done) {
    node.startRelay().then(() => {
      // node.startForger()
      setTimeout(() => {
        node.addPeers(2, done)
      }, 400)
    })
  })

  describe('incorrect nethash in headers', ()=> {
    it('should fail', function (done) {
      node.get('/peer/list')
        .set('nethash', 'incorrect')
        .end(function (err, res) {
          // node.debug('> Response:'.grey, JSON.stringify(res.body))
          node.debug('> Response:', JSON.stringify(res.body))
          node.expect(res.body).to.have.property('success').to.be.not.ok
          node.expect(res.body.expected).to.equal(node.config.nethash)
          done()
        })
    })
  })

  describe('valid nethash in headers', ()=> {
    it('should be OK', function (done) {
      node.get('/peer/list')
        .end(function (err, res) {
          // node.debug('> Response:'.grey, JSON.stringify(res.body))
          node.debug('> Response:', JSON.stringify(res.body))
          node.expect(res.body).to.have.property('peers').that.is.an('array')
          node.expect(res.body.peers).to.have.length.of.at.least(0)
          res.body.peers.forEach(function (peer) {
            node.expect(peer).to.have.property('ip').that.is.a('string')
            node.expect(peer).to.have.property('port').that.is.a('number')
            node.expect(peer).to.have.property('os')
            node.expect(peer).to.have.property('version')
          })
          done()
        })
    })
  })
})
