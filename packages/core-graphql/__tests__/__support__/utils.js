'use strict'

class Helpers {
  async request (query) {
    const url = 'http://localhost:4005/graphql'

    const server = require('@arkecosystem/core-container').resolvePlugin('graphql')

    // Injecting the request into Hapi server instead of using axios
    const injectOptions = {
      method: 'POST',
      url,
      headers: {},
      payload: { query }
    }

    const response = await server.inject(injectOptions)
    Object.assign(response, { data: JSON.parse(response.result || null), status: response.statusCode })
    return response
  }

  expectJson (response) {
    expect(response.data).toBeObject()
  }

  expectStatus (response, code) {
    expect(response.status).toBe(code)
  }

  expectResource (response) {
    expect(response.data.data).toBeObject()
  }

  expectCollection (response) {
    expect(Array.isArray(response.data.data)).toBe(true)
  }

  expectSuccessful (response, statusCode = 200) {
    this.expectStatus(response, statusCode)
    this.expectJson(response)
  }

  expectError (response, statusCode = 404) {
    this.expectStatus(response, statusCode)
    this.expectJson(response)
    expect(response.data.statusCode).toBeNumber()
    expect(response.data.error).toBeString()
    expect(response.data.message).toBeString()
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
