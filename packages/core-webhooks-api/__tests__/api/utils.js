'use strict'

const chai = require('chai')
const chaiHttp = require('chai-http')

chai.use(chaiHttp)

class Helpers {
  request (method, path, authorization, params = {}) {
    let request = chai.request('http://localhost:4004/api/')

    request = request[method.toLowerCase()](path)
    request = (method === 'GET') ? request.query(params) : request.send(params)

    return request.set('Authorization', authorization)
  }

  expectJson (data) {
    expect(data.body).toBeObject()
  }

  expectStatus (data, code) {
    expect(data.statusCode).toBe(code)
  }
  expectResource (data) {
    expect(data.body.data).toBeObject()
  }

  expectCollection (data) {
    expect(Array.isArray(data.body.data)).toBe(true)
  }

  expectPaginator (data, firstPage = true) {
    expect(data.body.meta).toBeObject()
    expect(data.body.meta).toHaveProperty('count')
    expect(data.body.meta).toHaveProperty('pageCount')
    expect(data.body.meta).toHaveProperty('totalCount')
    expect(data.body.meta).toHaveProperty('next')
    expect(data.body.meta).toHaveProperty('previous')
    expect(data.body.meta).toHaveProperty('self')
    expect(data.body.meta).toHaveProperty('first')
    expect(data.body.meta).toHaveProperty('last')
  }

  expectSuccessful (data, statusCode = 200) {
    this.expectStatus(data, statusCode)
    this.expectJson(data)
  }

  expectError (data, statusCode = 404) {
    this.expectStatus(data, statusCode)
    this.expectJson(data)
    expect(data.body.statusCode).toBeInteger()
    expect(data.body.error).toBeString()
    expect(data.body.message).toBeString()
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
