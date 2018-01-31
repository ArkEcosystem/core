const chai = require('chai')

class Helpers {
  request (method, path, params = {}) {
    let request = chai
      .request('http://localhost:4003/api/')

    request = request[method.toLowerCase()](path)
    request = (method === 'GET') ? request.query(params) : request.send(params)

    return request.set('Accept-Version', '1.0.0')
  }

  assertJson (data) {
    expect(data.body).toBeType('object')
  }

  assertStatus (data, code) {
    expect(data.statusCode).toBe(code)
  }

  assertVersion (data, version) {
    expect(data.body.meta).toBeType('object')
    expect(data.body.meta).toHaveProperty('matchedVersion', version)
  }

  assertState (data, state) {
    expect(data.body).toHaveProperty('success', state)
  }

  assertSuccessful (err, res) {
    expect(err).toBeNull()
    this.assertStatus(res, 200)
    this.assertJson(res)
    this.assertState(res, true)
    this.assertVersion(res, '1.0.0')
  }

  assertError (err, res) {
    expect(err).toBeNull()
    this.assertStatus(res, 200)
    this.assertJson(res)
    this.assertState(res, false)
    this.assertVersion(res, '1.0.0')
  }
}

module.exports = new Helpers()
