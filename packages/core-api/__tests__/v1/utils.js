'use strict'

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

  expectJson (data) {
    expect(data.body).toBeObject()
  }

  expectStatus (data, code) {
    expect(data.statusCode).toBe(code)
  }

  assertVersion (data, version) {
    expect(data.headers).toBeObject()
    expect(data.headers).toHaveProperty('api-version', version)
  }

  expectState (data, state) {
    expect(data.body).toHaveProperty('success', state)
  }

  expectSuccessful (response) {
    this.expectStatus(response, 200)
    this.expectJson(response)
    this.expectState(response, true)
    this.assertVersion(response, '1')
  }

  expectError (response) {
    this.expectStatus(response, 200)
    this.expectJson(response)
    this.expectState(response, false)
    this.assertVersion(response, '1')
  }

  expectDelegate (response) {
    expect(response).toHaveProperty('username')
    expect(response).toHaveProperty('address')
    expect(response).toHaveProperty('publicKey')
    expect(response).toHaveProperty('votes')
  }

  expectWallet (response) {
    expect(response).toHaveProperty('username')
    expect(response).toHaveProperty('address')
    expect(response).toHaveProperty('publicKey')
    expect(response).toHaveProperty('balance')
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
