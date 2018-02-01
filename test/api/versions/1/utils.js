const chai = require('chai')

class Helpers {
  request (method, path, params = {}) {
    let request = chai.request('http://localhost:4003/api/')

    request = request[method.toLowerCase()](path)
    request = (method === 'GET') ? request.query(params) : request.send(params)

    return request.set('API-Version', '1')
  }

  assertJson (data) {
    expect(data.body).toBeType('object')
  }

  assertStatus (data, code) {
    expect(data.statusCode).toBe(code)
  }

  assertVersion (data, version) {
    expect(data.headers).toBeType('object')
    expect(data.headers).toHaveProperty('api-version', version)
  }

  assertState (data, state) {
    expect(data.body).toHaveProperty('success', state)
  }

  assertSuccessful (err, res) {
    expect(err).toBeNull()
    this.assertStatus(res, 200)
    this.assertJson(res)
    this.assertState(res, true)
    this.assertVersion(res, '1')
  }

  assertError (err, res) {
    expect(err).toBeNull()
    this.assertStatus(res, 200)
    this.assertJson(res)
    this.assertState(res, false)
    this.assertVersion(res, '1')
  }
}

module.exports = new Helpers()
