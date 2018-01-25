const Helpers = require('../helpers')

const delegateUsername = 'dark_jmc'
const delegateAddress = 'D5PXQVeJmchVrZFHL7cALZK8mWWzjCaVfz'
const delegatePublicKey = '02a9a0ac34a94f9d27fd9b4b56eb3c565a9a3f61e660f269775fb456f7f3301586'

describe('API 2.0 - Delegates', () => {
  describe('GET /api/delegates', () => {
    it('should GET all the delegates', (done) => {
      Helpers.request('GET', 'delegates').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        const delegate = res.body.data[0]
        delegate.should.have.property('username').which.is.a('string')
        delegate.should.have.property('address').which.is.a('string')
        delegate.should.have.property('public_key').which.is.a('string')

        done()
      })
    })
  })

  describe('GET /api/delegates/:id', () => {
    it('should GET a delegate by the given username', (done) => {
      Helpers.request('GET', `delegates/${delegateUsername}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('username').which.is.a('string').and.equals(delegateUsername)
        res.body.data.should.have.property('address').which.is.a('string').and.equals(delegateAddress)
        res.body.data.should.have.property('public_key').which.is.a('string').and.equals(delegatePublicKey)

        done()
      })
    })

    it('should GET a delegate by the given address', (done) => {
      Helpers.request('GET', `delegates/${delegateAddress}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('username').which.is.a('string').and.equals(delegateUsername)
        res.body.data.should.have.property('address').which.is.a('string').and.equals(delegateAddress)
        res.body.data.should.have.property('public_key').which.is.a('string').and.equals(delegatePublicKey)

        done()
      })
    })

    it('should GET a delegate by the given public key', (done) => {
      Helpers.request('GET', `delegates/${delegatePublicKey}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        res.body.data.should.have.property('username').which.is.a('string').and.equals(delegateUsername)
        res.body.data.should.have.property('address').which.is.a('string').and.equals(delegateAddress)
        res.body.data.should.have.property('public_key').which.is.a('string').and.equals(delegatePublicKey)

        done()
      })
    })
  })

  describe('GET /api/delegates/:id/blocks', () => {
    it('should GET all blocks for a delegate by the given id', (done) => {
      Helpers.request('GET', `delegates/${delegatePublicKey}/blocks`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        const block = res.body.data[1]
        block.should.have.property('id').which.is.a('string')
        block.should.have.property('version').which.is.a('number')
        block.should.have.property('height').which.is.a('number')
        block.should.have.property('previous').which.is.a('string')

        block.should.have.property('forged').which.is.an('object')
        block.forged.should.have.property('reward').which.is.an('number')
        block.forged.should.have.property('fee').which.is.an('number')

        block.should.have.property('payload').which.is.an('object')
        block.payload.should.have.property('length').which.is.an('number')
        block.payload.should.have.property('hash').which.is.an('string')

        block.should.have.property('generator').which.is.an('object')
        block.generator.should.have.property('public_key').which.is.an('string')

        block.should.have.property('signature').which.is.an('string')
        block.should.have.property('transactions').which.is.an('number')

        done()
      })
    })
  })

  describe('GET /api/delegates/:id/voters', () => {
    it('should GET all voters for a delegate by the given id', (done) => {
      Helpers.request('GET', `delegates/${delegatePublicKey}/voters`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        const voter = res.body.data[0]
        voter.should.have.property('address').which.is.a('string')
        voter.should.have.property('public_key').which.is.a('string')
        voter.should.have.property('balance').which.is.a('number')
        voter.should.have.property('is_delegate').which.is.a('boolean')

        done()
      })
    })
  })
})
