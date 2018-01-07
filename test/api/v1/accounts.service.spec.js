const chai = require('chai')
const sinonChai = require('sinon-chai')

// Chai plugins
chai.use(sinonChai)

const base = 'http://localhost:4003'

describe('GET /api/accounts', () => {
  /*it('should return account information', (done) => {
    request.get(`${base}/api/accounts/?address=DRac35wghMcmUSe5jDMLBDLWkVVjyKZFxK`, (err, res, body) => {
      res.statusCode.should.eql(200)
      res.headers['content-type'].should.contain('application/json')
      body = JSON.parse(body)
      body.status.should.eql('success')
      body.data[0].should.include.keys(
        'address','publicKey','secondPublicKey','vote','username','balance','votebalance'
      )
      done()
    })
  })*/

  it('should return account/wallet information', function(done) {
    chai.request(`${base}/api/accounts/?address=DRac35wghMcmUSe5jDMLBDLWkVVjyKZFxK`)
      .get('/')
      .end(function(err, res) {
        expect(res).to.have.status(123);
        done();                               // <= Call done to signal callback end
      });
  });
})
