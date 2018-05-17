'use strict'

require('../../__support__/setup')

const utils = require('../utils')

describe('API 1.0 - Signatures', () => {
  describe('GET /signatures/fee', () => {
    it('should return second signature value from config', async () => {
      const response = await utils.request('GET', 'signatures/fee')
      utils.expectSuccessful(response)

      expect(response.body.fee).toBeNumber()
    })
  })
})
