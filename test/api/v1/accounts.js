//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
const sinonChai = require('sinon-chai')

chai.use(sinonChai);

describe('Accounts', () => {
  /*
  * Test the /GET route
  */
  describe('/GET book', () => {
    it('it should GET all the books', (done) => {
      chai.request(server)
        .get('api/accounts/?address=DRac35wghMcmUSe5jDMLBDLWkVVjyKZFxK')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('array')
          res.body.length.should.be.eql(0)
          done()
        })
    })
  })

})
