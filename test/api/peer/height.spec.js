const node = require('test/support/node')
// TODO inject automatically
const { expect } = require('chai')

describe('GET /peers/height', function () {

  // before(() => {
  //   this.timeout(10 * 1000)
  //   return node.resumeRelay()
  // })

  // after(() => {
  //   return node.stopRelay()
  // })

  context('using an incorrect nethash', ()=> {
    // FIXME current code doesn't check that the nethash is correct
    xit("shouldn't be OK", function () {
      return node.get('/peer/height')
        .set('nethash', 'wrong')
        .then(res => {
          expect(res.body).to.have.property('success').to.not.be.ok
        })
    })
  })

  context('using valid headers', ()=> {
    const request = callback => {
      return new Promise((resolve, reject) => {
        node.get('/peer/height')
          .then(res => {
            callback(res.body, res)
            resolve()
          })
          .catch(err => reject(err))
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
