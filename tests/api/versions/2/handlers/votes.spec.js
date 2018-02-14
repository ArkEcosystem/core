const utils = require('../utils')

const voteId = '663d7e247c8876f1431ebac93bbbc9031fcbc804954a7133c451bce6edd5aee0'

describe('API 2.0 - Votes', () => {
  describe('GET /api/votes', () => {
    it('should GET all the votes', async () => {
      const res = await utils.request('GET', 'votes')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
      await utils.assertPaginator(res)

      const vote = res.body.data[0]
      await expect(vote.id).toBeType('string')
      await expect(vote.type).toBeType('number')
      await expect(vote.amount).toBeType('number')
      await expect(vote.fee).toBeType('number')
      await expect(vote.sender).toBeType('string')
      await expect(vote.recipient).toBeType('string')
      await expect(vote.signature).toBeType('string')
      await expect(vote.asset).toBeType('object')
      await expect(vote.asset.votes).toBeType('array')

      await expect(res.body.meta.count).toBeType('number')
    })
  })

  describe('GET /api/votes/:id', () => {
    it('should GET a vote by the given identifier', async () => {
      const res = await utils.request('GET', `votes/${voteId}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data.id).toBeType('string')
      await expect(res.body.data.id).toBe(voteId)

      await expect(res.body.data.type).toBeType('number')
      await expect(res.body.data.amount).toBeType('number')
      await expect(res.body.data.fee).toBeType('number')
      await expect(res.body.data.sender).toBeType('string')
      await expect(res.body.data.recipient).toBeType('string')
      await expect(res.body.data.signature).toBeType('string')
      await expect(res.body.data.asset).toBeType('object')
      await expect(res.body.data.asset.votes).toBeType('array')
    })
  })
})
