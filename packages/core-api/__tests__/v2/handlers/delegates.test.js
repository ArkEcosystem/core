'use strict'

require('../../__support__/setup')

const utils = require('../utils')

const delegateUsername = 'genesis_9'
const delegateAddress = 'AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo'
const delegatePublicKey = '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'

describe('API 2.0 - Delegates', () => {
  describe('GET /delegates', () => {
    it('should GET all the delegates', async () => {
      const response = await utils.request('GET', 'delegates')
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      const delegate = response.body.data[0]
      expect(delegate.username).toBeString()
      expect(delegate.address).toBeString()
      expect(delegate.publicKey).toBeString()
    })
  })

  describe('GET /delegates/:id', () => {
    it('should GET a delegate by the given username', async () => {
      const response = await utils.request('GET', `delegates/${delegateUsername}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data).toHaveProperty('username', delegateUsername)
      expect(response.body.data).toHaveProperty('address', delegateAddress)
      expect(response.body.data).toHaveProperty('publicKey', delegatePublicKey)
    })

    it('should GET a delegate by the given address', async () => {
      const response = await utils.request('GET', `delegates/${delegateAddress}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data).toHaveProperty('username', delegateUsername)
      expect(response.body.data).toHaveProperty('address', delegateAddress)
      expect(response.body.data).toHaveProperty('publicKey', delegatePublicKey)
    })

    it('should GET a delegate by the given public key', async () => {
      const response = await utils.request('GET', `delegates/${delegatePublicKey}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.body.data).toHaveProperty('username', delegateUsername)
      expect(response.body.data).toHaveProperty('address', delegateAddress)
      expect(response.body.data).toHaveProperty('publicKey', delegatePublicKey)
    })
  })

  describe.skip('GET /delegates/:id/blocks', () => {
    it('should GET all blocks for a delegate by the given identifier', async () => {
      const response = await utils.request('GET', `delegates/${delegatePublicKey}/blocks`)
      utils.expectSuccessful(response)
      utils.expectCollection(response)
      utils.expectBlock(response.body.data[0])
    })
  })

  describe('GET /delegates/:id/voters', () => {
    it('should GET all voters for a delegate by the given identifier', async () => {
      const response = await utils.request('GET', `delegates/${delegatePublicKey}/voters`)
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      const voter = response.body.data[0]
      expect(voter.address).toBeString()
      expect(voter.publicKey).toBeString()
      expect(voter.balance).toBeNumber()
      expect(voter.isDelegate).toBeBoolean()
    })
  })
})
