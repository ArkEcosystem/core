'use strict'

require('@arkecosystem/core-test-utils/lib/matchers')
const app = require('../../__support__/setup')
const utils = require('../utils')

const voteId = 'ea294b610e51efb3ceb4229f27bf773e87f41d21b6bb1f3bf68629ffd652c2d3'

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 2.0 - Votes', () => {
  describe('GET /votes', () => {
    it('should GET all the votes', async () => {
      const response = await utils.request('GET', 'votes')
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeArray()
      utils.expectPaginator(response)

      expect(response.data.data[0]).toBeObject()
      expect(response.data.meta.count).toBeNumber()
    })
  })

  describe('GET /votes/:id', () => {
    it('should GET a vote by the given identifier', async () => {
      const response = await utils.request('GET', `votes/${voteId}`)
      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeObject()

      expect(response.data.data).toBeObject()
      expect(response.data.data.id).toBe(voteId)
    })
  })
})
