'use strict'

require('../../__support__/setup')

const utils = require('../utils')

const voteId = 'ea294b610e51efb3ceb4229f27bf773e87f41d21b6bb1f3bf68629ffd652c2d3'

describe('API 2.0 - Votes', () => {
  describe('GET /votes', () => {
    it('should GET all the votes', async () => {
      const response = await utils.request('GET', 'votes')
      utils.expectSuccessful(response)
      utils.expectCollection(response)
      utils.expectPaginator(response)

      expect(response.body.data[0]).toBeObject()
      expect(response.body.meta.count).toBeNumber()
    })
  })

  describe('GET /votes/:id', () => {
    it('should GET a vote by the given identifier', async () => {
      const response = await utils.request('GET', `votes/${voteId}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data).toBeObject()
      expect(response.body.data.id).toBe(voteId)
    })
  })
})
