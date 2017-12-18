const node = require('test/support/node')
// TODO inject automatically
const { expect } = require('chai')

xdescribe('GET /peers/height', function () {

  before(function () {
    return node.startRelay()
  })

  after(function () {
    return node.stopRelay()
  })

  xcontext('using an incorrect nethash', ()=> {
    it("shouldn't be OK", function (done) {
      node.get('/peer/height')
        .set('nethash', 'wrong')
        .end((err, res) => {
          expect(res.body).to.have.property('success').to.not.be.ok
          done()
        })
    })
  })

  context('using valid headers', ()=> {
    const request = callback => {
      return new Promise((resolve, reject) => {
        node.get('/peer/height', (err, res) => {
          callback(res.body, res)
          resolve()
        })
      })
    }

    it('should be OK', function () {
      return request(body => {
        expect(body).to.have.property('success').to.be.ok
      })
    })

    it('should respond with the block height', function () {
      return request(body => {
        expect(body).to.have.property('height').that.is.a('number')
      })
    })

    it('should respond with the last block id', function () {
      return request(body => {
        expect(body).to.have.property('id').that.is.a('string')
      })
    })
  })
})
