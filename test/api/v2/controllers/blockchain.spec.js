const Helpers = require('../helpers')

describe('API 2.0 - Blockchain', () => {
  describe('GET /api/blockchain', () => {
    it('should GET the blockchain constants', (done) => {
      Helpers.request('GET', 'blockchain').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('data').which.is.an('object')
        res.body.data.should.have.property('height').which.is.a('number')
        res.body.data.should.have.property('reward').which.is.a('number')
        res.body.data.should.have.property('activeDelegates').which.is.a('number')
        res.body.data.should.have.property('blocktime').which.is.a('number')

        res.body.data.should.have.property('block').which.is.an('object')
        res.body.data.block.should.have.property('version').which.is.a('number')
        res.body.data.block.should.have.property('maxTransactions').which.is.a('number')
        res.body.data.block.should.have.property('maxPayload').which.is.a('number')

        res.body.data.should.have.property('epoch').which.is.a('string')

        res.body.data.should.have.property('fees').which.is.an('object')
        res.body.data.fees.should.have.property('send').which.is.a('number')
        res.body.data.fees.should.have.property('vote').which.is.a('number')
        res.body.data.fees.should.have.property('secondsignature').which.is.a('number')
        res.body.data.fees.should.have.property('delegate').which.is.a('number')
        res.body.data.fees.should.have.property('multisignature').which.is.a('number')

        done()
      })
    })
  })
})
