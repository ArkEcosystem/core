const Helpers = require('../helpers')

const voteId = '663d7e247c8876f1431ebac93bbbc9031fcbc804954a7133c451bce6edd5aee0'

describe('API 2.0 - Votes', () => {
  describe('GET /api/votes', () => {
    it('should GET all the votes', (done) => {
      Helpers.request('GET', 'votes').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)
        Helpers.assertPaginator(res)

        const vote = res.body.data[0]
        expect(vote.id).toBeType('string')
        expect(vote.type).toBeType('number')
        expect(vote.amount).toBeType('number')
        expect(vote.fee).toBeType('number')
        expect(vote.sender).toBeType('string')
        expect(vote.recipient).toBeType('string')
        expect(vote.signature).toBeType('string')
        expect(vote.asset).toBeType('object')
        expect(vote.asset.votes).toBeType('array')

        expect(res.body.meta.count).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/votes/:id', () => {
    it('should GET a vote by the given identifier', (done) => {
      Helpers.request('GET', `votes/${voteId}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data.id).toBeType('string')
        expect(res.body.data.id).toBe(voteId)

        expect(res.body.data.type).toBeType('number')
        expect(res.body.data.amount).toBeType('number')
        expect(res.body.data.fee).toBeType('number')
        expect(res.body.data.sender).toBeType('string')
        expect(res.body.data.recipient).toBeType('string')
        expect(res.body.data.signature).toBeType('string')
        expect(res.body.data.asset).toBeType('object')
        expect(res.body.data.asset.votes).toBeType('array')

        done()
      })
    })
  })
})
