'use strict'

beforeAll(async (done) => {
  await require('../../__support__/setup')()

  done()
})

const utils = require('../utils')

const voteId = '663d7e247c8876f1431ebac93bbbc9031fcbc804954a7133c451bce6edd5aee0'

describe('API 2.0 - Votes', () => {
  describe('GET /votes', () => {
    it('should GET all the votes', async () => {
      const res = await utils.request('GET', 'votes')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
      await utils.assertPaginator(res)

      const vote = res.body.data[0]
      await expect(vote.id).toBeString()
      await expect(vote.type).toBeNumber()
      await expect(vote.amount).toBeNumber()
      await expect(vote.fee).toBeNumber()
      await expect(vote.sender).toBeString()
      await expect(vote.recipient).toBeString()
      await expect(vote.signature).toBeString()
      await expect(vote.asset).toBeObject()
      await expect(vote.asset.votes).toBeArray()

      await expect(res.body.meta.count).toBeNumber()
    })
  })

  describe('GET /votes/:id', () => {
    it('should GET a vote by the given identifier', async () => {
      const res = await utils.request('GET', `votes/${voteId}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.id).toBeString()
      await expect(res.body.data.id).toBe(voteId)

      await expect(res.body.data.type).toBeNumber()
      await expect(res.body.data.amount).toBeNumber()
      await expect(res.body.data.fee).toBeNumber()
      await expect(res.body.data.sender).toBeString()
      await expect(res.body.data.recipient).toBeString()
      await expect(res.body.data.signature).toBeString()
      await expect(res.body.data.asset).toBeObject()
      await expect(res.body.data.asset.votes).toBeArray()
    })
  })
})
