const axios = require('axios')

class Helpers {
  request(method, path, params = {}) {
    const url = `http://localhost:4004/api/${path}`
    const request = axios[method.toLowerCase()]

    return ['GET', 'DELETE'].includes(method)
      ? request(url, { params })
      : request(url, params)
  }

  expectJson(response) {
    expect(response.data).toBeObject()
  }

  expectStatus(response, code) {
    expect(response.status).toBe(code)
  }

  expectResource(response) {
    expect(response.data.data).toBeObject()
  }

  expectCollection(response) {
    expect(Array.isArray(response.data.data)).toBe(true)
  }

  expectPaginator(response, firstPage = true) {
    expect(response.data.meta).toBeObject()
    expect(response.data.meta).toHaveProperty('count')
    expect(response.data.meta).toHaveProperty('pageCount')
    expect(response.data.meta).toHaveProperty('totalCount')
    expect(response.data.meta).toHaveProperty('next')
    expect(response.data.meta).toHaveProperty('previous')
    expect(response.data.meta).toHaveProperty('self')
    expect(response.data.meta).toHaveProperty('first')
    expect(response.data.meta).toHaveProperty('last')
  }

  expectSuccessful(response, statusCode = 200) {
    this.expectStatus(response, statusCode)
    this.expectJson(response)
  }

  expectError(response, statusCode = 404) {
    this.expectStatus(response, statusCode)
    this.expectJson(response)
    expect(response.data.statusCode).toBeInteger()
    expect(response.data.error).toBeString()
    expect(response.data.message).toBeString()
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
