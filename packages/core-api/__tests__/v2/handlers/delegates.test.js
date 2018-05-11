'use strict'

require('../../__support__/setup')

const utils = require('../utils')

const delegateUsername = 'genesis_9'
const delegateAddress = 'AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo'
const delegatePublicKey = '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'

describe('API 2.0 - Delegates', () => {
  describe('GET /delegates', () => {
    it('should GET all the delegates', async () => {
      const res = await utils.request('GET', 'delegates')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const delegate = res.body.data[0]
      await expect(delegate.username).toBeString()
      await expect(delegate.address).toBeString()
      await expect(delegate.publicKey).toBeString()
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

  describe.skip('GET /delegates/:id/blocks', () => {
    it('should GET all blocks for a delegate by the given identifier', async () => {
      const res = await utils.request('GET', `delegates/${delegatePublicKey}/blocks`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
      await utils.assertBlock(res.body.data[0])
    })
  })

  describe('GET /delegates/:id/voters', () => {
    it('should GET all voters for a delegate by the given identifier', async () => {
      const res = await utils.request('GET', `delegates/${delegatePublicKey}/voters`)
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      const voter = res.body.data[0]
      await expect(voter.address).toBeString()
      await expect(voter.publicKey).toBeString()
      await expect(voter.balance).toBeNumber()
      await expect(voter.isDelegate).toBeBoolean()
    })
  })
})
