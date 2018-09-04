'use strict'

const app = require('../../__support__/setup')
const utils = require('../utils')

const delegate = {
  username: 'genesis_9',
  address: 'AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo',
  publicKey: '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
}

beforeAll(async () => {
  await app.setUp({})
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 2.0 - Delegates', () => {
  describe('GET /delegates', () => {
    it('should GET all the delegates', async () => {
      const response = await utils.request('GET', 'delegates')
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      utils.expectDelegate(response.data.data[0])
    })
  })

  describe('GET /delegates/:id', () => {
    it('should GET a delegate by the given username', async () => {
      const response = await utils.request('GET', `delegates/${delegate.username}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      utils.expectDelegate(response.data.data, delegate)
    })

    it('should GET a delegate by the given address', async () => {
      const response = await utils.request('GET', `delegates/${delegate.address}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      utils.expectDelegate(response.data.data, delegate)
    })

    it('should GET a delegate by the given public key', async () => {
      const response = await utils.request('GET', `delegates/${delegate.publicKey}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      utils.expectDelegate(response.data.data, delegate)
    })
  })

  describe('POST /delegates/search', () => {
    it('should POST a search for delegates with a username that matches the given string', async () => {
      const response = await utils.request('POST', 'delegates/search', { username: delegate.username })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      utils.expectDelegate(response.data.data[0], delegate)
    })
  })

  describe.skip('GET /delegates/:id/blocks', () => {
    it('should GET all blocks for a delegate by the given identifier', async () => {
      const response = await utils.request('GET', `delegates/${delegate.publicKey}/blocks`)
      utils.expectSuccessful(response)
      utils.expectCollection(response)
      utils.expectBlock(response.data.data[0])
    })
  })

  describe('GET /delegates/:id/voters', () => {
    it('should GET all voters (wallets) for a delegate by the given identifier', async () => {
      const response = await utils.request('GET', `delegates/${delegate.publicKey}/voters`)
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      utils.expectWallet(response.data.data[0])
    })
  })
})
