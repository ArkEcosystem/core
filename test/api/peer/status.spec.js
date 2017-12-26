const node = require('test/support/node')
// TODO inject automatically
const { expect } = require('chai')

describe('GET /peers/status', function () {

  // before(() => {
  //   this.timeout(10 * 1000)
  //   return node.resumeRelay()
  // })

  // FIXME stop tests
  // after(() => {
  //   return node.stopRelay()
  // })

  const request = callback => {
    return new Promise((resolve, reject) => {
      node.get('/peer/status')
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

  it('should respond if is forging allowed', function () {
    return request(body => {
      expect(body).to.have.property('forgingAllowed').that.is.a('boolean')
    })
  })

  // TODO rephrase to explain "slot"
  it('should respond the current slot number', function () {
    return request(body => {
      expect(body).to.have.property('currentSlot').that.is.a('number')
    })
  })

  // TODO remove the Model data?
  it('should include the entire block data, as header', function () {
    return request(body => {
      // TODO add custom expectation likeBlock() or something similar
      // TODO test that is like a serialized block
      expect(body).to.have.property('header')
    })
  })
})
