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
        vote.should.have.property('id').which.is.a('string')
        vote.should.have.property('type').which.is.a('number')
        vote.should.have.property('amount').which.is.a('number')
        vote.should.have.property('fee').which.is.a('number')
        vote.should.have.property('sender').which.is.a('string')
        vote.should.have.property('recipient').which.is.a('string')
        vote.should.have.property('signature').which.is.a('string')
        vote.should.have.property('asset').which.is.an('object')
        vote.asset.should.have.property('votes').which.is.an('array')

        res.body.meta.should.have.property('count').which.is.an('number')

        done()
      })
    })
  })

  describe('GET /api/votes/:id', () => {
    it('should GET a vote by the given id', (done) => {
      Helpers.request('GET', `votes/${voteId}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('id').which.is.a('string').and.equals(voteId)
        res.body.data.should.have.property('type').which.is.a('number')
        res.body.data.should.have.property('amount').which.is.a('number')
        res.body.data.should.have.property('fee').which.is.a('number')
        res.body.data.should.have.property('sender').which.is.a('string')
        res.body.data.should.have.property('recipient').which.is.a('string')
        res.body.data.should.have.property('signature').which.is.a('string')
        res.body.data.should.have.property('asset').which.is.an('object')
        res.body.data.asset.should.have.property('votes').which.is.an('array')

        done()
      })
    })
  })
})
