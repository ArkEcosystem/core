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

  assertJson (data) {
    expect(data.body).toBeObject()
  }

  assertStatus (data, code) {
    expect(data.statusCode).toBe(code)
  }
  assertResource (data) {
    expect(data.body.data).toBeObject()
  }

  assertCollection (data) {
    expect(Array.isArray(data.body.data)).toBe(true)
  }

  assertPaginator (data, firstPage = true) {
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

  assertSuccessful (res, statusCode = 200) {
    this.assertStatus(res, statusCode)
    this.assertJson(res)
  }

  assertError (res, statusCode = 404) {
    this.assertStatus(res, statusCode)
    this.assertJson(res)
    expect(res.body.statusCode).toBeInteger()
    expect(res.body.error).toBeString()
    expect(res.body.message).toBeString()
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
