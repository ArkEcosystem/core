const node = require('test/support/node')

describe('GET /peer/list', function () {

  // FIXME
  before(function (done) {
    node.resumeRelay().then(() => {
      // node.startForger()
      setTimeout(() => {
        node.addPeers(2, done)
      }, 400)
    })
  })

  // after(function () {
  //   return node.stopRelay()
  // })

  describe('incorrect nethash in headers', ()=> {
    it('should fail', function () {
      return node.get('/peer/list')
        .set('nethash', 'incorrect')
        .then(res => {
          // node.debug('> Response:'.grey, JSON.stringify(res.body))
          node.debug('> Response:', JSON.stringify(res.body))
          node.expect(res.body).to.have.property('success').to.be.not.ok
          node.expect(res.body.expected).to.equal(node.config.nethash)
        })
        // .catch(err )
    })
  })

  describe('valid nethash in headers', ()=> {
    it('should be OK', function () {
      return node.get('/peer/list')
        .then(res => {
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
        })
    })
  })
})
