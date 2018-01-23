const chai = require('chai')
const { expect } = require('chai')

class Helpers {
  request (url) {
    return chai
      .request('http://localhost:4003/api/')
      .get(url)
      .set('Accept-Version', '1.0.0')
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

  assertState (data, state) {
    expect(data.body.success).to.be.equal(state)
  }

  assertSuccessful (err, res) {
    expect(err).to.be.a('null')
    this.assertStatus(res, 200)
    this.assertJson(res)
    this.assertState(res, true)
    this.assertVersion(res, '1.0.0')
  }

  assertError (err, res) {
    expect(err).to.be.a('null')
    this.assertStatus(res, 200)
    this.assertJson(res)
    this.assertState(res, false)
    this.assertVersion(res, '1.0.0')
  }
}

module.exports = new Helpers()
