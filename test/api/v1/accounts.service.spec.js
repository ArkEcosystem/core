const chai = require('chai')
const { expect } = require('chai')

const base = 'http://localhost:4003'

describe('GET DEVNET /api/accounts', () => {
  it('should return account/wallet information', function(done) {
    chai.request(base)
      .get('/api/accounts/?address=DRac35wghMcmUSe5jDMLBDLWkVVjyKZFxK')
      .end((err, res)  => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.account).to.have.all.keys(['address','publicKey','secondPublicKey','vote','username','balance','votebalance'])
        done()
      })
  })
})
