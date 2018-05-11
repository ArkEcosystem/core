'use strict'

require('../../__support__/setup')

const utils = require('../utils')

const voteId = 'ea294b610e51efb3ceb4229f27bf773e87f41d21b6bb1f3bf68629ffd652c2d3'

describe('API 2.0 - Votes', () => {
  describe('GET /votes', () => {
    it('should GET all the votes', async () => {
      const res = await utils.request('GET', 'votes')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
      await utils.assertPaginator(res)

      await expect(res.body.data[0]).toBeObject()
      await expect(res.body.meta.count).toBeNumber()
    })
  })

  describe('GET /votes/:id', () => {
    it('should GET a vote by the given identifier', async () => {
      const res = await utils.request('GET', `votes/${voteId}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data).toBeObject()
      await expect(res.body.data.id).toBe(voteId)
    })
  })
})
