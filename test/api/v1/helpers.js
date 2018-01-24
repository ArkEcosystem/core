const chai = require('chai')
const should = chai.should()

class Helpers {
  request (method, path, params = {}) {
    let request = chai
      .request('http://localhost:4003/api/')

    request = request[method.toLowerCase()](path)
    request = (method === 'GET') ? request.query(params) : request.send(params)

    return request.set('Accept-Version', '1.0.0')
  }

  assertJson (data) {
    data.body.should.be.a('object')
  }

  assertStatus (data, code) {
    data.should.have.status(code)
  }

  assertVersion (data, version) {
    data.body.should.have.property('meta').which.is.an('object')
    data.body.meta.should.have.property('matchedVersion').eql(version)
  }

  assertState (data, state) {
    data.body.should.have.property('success').eql(state)
  }

  assertSuccessful (err, res) {
    should.not.exist(err)
    this.assertStatus(res, 200)
    this.assertJson(res)
    this.assertState(res, true)
    this.assertVersion(res, '1.0.0')
  }

  assertError (err, res) {
    should.not.exist(err)
    this.assertStatus(res, 200)
    this.assertJson(res)
    this.assertState(res, false)
    this.assertVersion(res, '1.0.0')
  }
}

module.exports = new Helpers()
