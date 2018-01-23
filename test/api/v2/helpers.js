const chai = require('chai')
const { expect } = require('chai')

class Helpers {
  request (url) {
    return chai
      .request('http://localhost:4003/api/')
      .get(url)
      .set('Accept-Version', '2.0.0')
  }

  assertJson (data) {
    expect(data).to.be.a('object')
  }

  assertStatus (data, code) {
    expect(data).to.have.status(code)
  }

  assertVersion (data, version) {
    expect(data.body.meta.matchedVersion).to.equal(version)
  }

  assertSuccessful (err, res, statusCode = 200) {
    expect(err).to.be.a('null')
    this.assertStatus(res, statusCode)
    this.assertJson(res)
    this.assertVersion(res, '2.0.0')
  }

  assertError (err, res, statusCode = 404) {
    expect(err).to.be.a('Error')
    this.assertStatus(res, statusCode)
    this.assertJson(res)
    expect(res.body.code).to.be.a('string')
    expect(res.body.message).to.be.a('string')
  }
}

module.exports = new Helpers()
