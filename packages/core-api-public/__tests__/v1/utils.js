'use strict';

const chai = require('chai')
const chaiHttp = require('chai-http')

chai.use(chaiHttp)

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

  assertSuccessful (res) {
    this.assertStatus(res, 200)
    this.assertJson(res)
    this.assertState(res, true)
    this.assertVersion(res, '1')
  }

  assertError (res) {
    this.assertStatus(res, 200)
    this.assertJson(res)
    this.assertState(res, false)
    this.assertVersion(res, '1')
  }
}

/**
 * [exports description]
 * @type {Helpers}
 */
module.exports = new Helpers()
