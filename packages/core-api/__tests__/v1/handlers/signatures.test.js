'use strict'

require('@arkecosystem/core-test-utils/lib/matchers')
const app = require('../../__support__/setup')
const utils = require('../utils')

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 1.0 - Signatures', () => {
  describe('GET /signatures/fee', () => {
    it('should return second signature value from config', async () => {
      const response = await utils.request('GET', 'signatures/fee')
      expect(response).toBeSuccessfulResponse()

      expect(response.data.fee).toBeNumber()
    })
  })
})
