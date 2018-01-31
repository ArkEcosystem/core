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
        expect(delegate.username).toBeType('string')
        expect(delegate.address).toBeType('string')
        expect(delegate.public_key).toBeType('string')

        done()
      })
    })
  })

  describe('GET /api/delegates/:id', () => {
    it('should GET a delegate by the given username', (done) => {
      Helpers.request('GET', `delegates/${delegateUsername}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data).toHaveProperty('username', delegateUsername)
        expect(res.body.data).toHaveProperty('address', delegateAddress)
        expect(res.body.data).toHaveProperty('public_key', delegatePublicKey)

        done()
      })
    })

    it('should GET a delegate by the given address', (done) => {
      Helpers.request('GET', `delegates/${delegateAddress}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data).toHaveProperty('username', delegateUsername)
        expect(res.body.data).toHaveProperty('address', delegateAddress)
        expect(res.body.data).toHaveProperty('public_key', delegatePublicKey)

        done()
      })
    })

    it('should GET a delegate by the given public key', (done) => {
      Helpers.request('GET', `delegates/${delegatePublicKey}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        expect(res.body.data).toHaveProperty('username', delegateUsername)
        expect(res.body.data).toHaveProperty('address', delegateAddress)
        expect(res.body.data).toHaveProperty('public_key', delegatePublicKey)

        done()
      })
    })
  })

  describe('GET /api/delegates/:id/blocks', () => {
    it('should GET all blocks for a delegate by the given identifier', (done) => {
      Helpers.request('GET', `delegates/${delegatePublicKey}/blocks`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        const block = res.body.data[1]
        expect(block.id).toBeType('string')
        expect(block.version).toBeType('number')
        expect(block.height).toBeType('number')
        // expect(block.previous).toBeType('string')

        expect(block.forged).toBeType('object')
        expect(block.forged.reward).toBeType('number')
        expect(block.forged.fee).toBeType('number')

        expect(block.payload).toBeType('object')
        expect(block.payload.length).toBeType('number')
        expect(block.payload.hash).toBeType('string')

        expect(block.generator).toBeType('object')
        expect(block.generator.public_key).toBeType('string')

        expect(block.signature).toBeType('string')
        expect(block.transactions).toBeType('number')

        done()
      })
    })
  })

  describe('GET /api/delegates/:id/voters', () => {
    it('should GET all voters for a delegate by the given identifier', (done) => {
      Helpers.request('GET', `delegates/${delegatePublicKey}/voters`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        const voter = res.body.data[0]
        expect(voter.address).toBeType('string')
        expect(voter.public_key).toBeType('string')
        expect(voter.balance).toBeType('number')
        expect(voter.is_delegate).toBeType('boolean')

        done()
      })
    })
  })
})
