'use strict';

const utils = require('../utils')

const delegateUsername = 'dark_jmc'
const delegateAddress = 'D5PXQVeJmchVrZFHL7cALZK8mWWzjCaVfz'
const delegatePublicKey = '02a9a0ac34a94f9d27fd9b4b56eb3c565a9a3f61e660f269775fb456f7f3301586'

describe('API 2.0 - Delegates', () => {
  describe('GET /delegates', () => {
    it('should GET all the delegates', async () => {
      const res = await utils.request('GET', 'delegates')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const delegate = res.body.data[0]
      await expect(delegate.username).toBeType('string')
      await expect(delegate.address).toBeType('string')
      await expect(delegate.publicKey).toBeType('string')
    })
  })

  describe('GET /delegates/:id', () => {
    it('should GET a delegate by the given username', async () => {
      const res = await utils.request('GET', `delegates/${delegateUsername}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data).toHaveProperty('username', delegateUsername)
      await expect(res.body.data).toHaveProperty('address', delegateAddress)
      await expect(res.body.data).toHaveProperty('publicKey', delegatePublicKey)
    })

    it('should GET a delegate by the given address', async () => {
      const res = await utils.request('GET', `delegates/${delegateAddress}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data).toHaveProperty('username', delegateUsername)
      await expect(res.body.data).toHaveProperty('address', delegateAddress)
      await expect(res.body.data).toHaveProperty('publicKey', delegatePublicKey)
    })

    it('should GET a delegate by the given public key', async () => {
      const res = await utils.request('GET', `delegates/${delegatePublicKey}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      await expect(res.body.data).toHaveProperty('username', delegateUsername)
      await expect(res.body.data).toHaveProperty('address', delegateAddress)
      await expect(res.body.data).toHaveProperty('publicKey', delegatePublicKey)
    })
  })

  describe('GET /delegates/:id/blocks', () => {
    it('should GET all blocks for a delegate by the given identifier', async () => {
      const res = await utils.request('GET', `delegates/${delegatePublicKey}/blocks`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const block = res.body.data[1]
      await expect(block.id).toBeType('string')
      await expect(block.version).toBeType('number')
      await expect(block.height).toBeType('number')
      // await expect(block.previous).toBeType('string')

      await expect(block.forged).toBeType('object')
      await expect(block.forged.reward).toBeType('number')
      await expect(block.forged.fee).toBeType('number')

      await expect(block.payload).toBeType('object')
      await expect(block.payload.length).toBeType('number')
      await expect(block.payload.hash).toBeType('string')

      await expect(block.generator).toBeType('object')
      await expect(block.generator.publicKey).toBeType('string')

      await expect(block.signature).toBeType('string')
      await expect(block.transactions).toBeType('number')
    })
  })

  describe('GET /delegates/:id/voters', () => {
    it('should GET all voters for a delegate by the given identifier', async () => {
      const res = await utils.request('GET', `delegates/${delegatePublicKey}/voters`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const voter = res.body.data[0]
      await expect(voter.address).toBeType('string')
      await expect(voter.publicKey).toBeType('string')
      await expect(voter.balance).toBeType('number')
      await expect(voter.isDelegate).toBeType('boolean')
    })
  })
})
