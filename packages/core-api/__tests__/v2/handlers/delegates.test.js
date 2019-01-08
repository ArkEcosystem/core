require('@arkecosystem/core-test-utils/lib/matchers')
const { Block } = require('@arkecosystem/crypto').models
const blocks2to100 = require('@arkecosystem/core-test-utils/fixtures/testnet/blocks.2-100')
const app = require('../../__support__/setup')
const utils = require('../utils')

const delegate = {
  username: 'genesis_9',
  address: 'AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo',
  publicKey:
    '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647',
}

let container

beforeAll(async () => {
  await app.setUp()
  container = require('@arkecosystem/core-container')
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 2.0 - Delegates', () => {
  describe('GET /delegates', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET all the delegates', async () => {
        const response = await utils[request]('GET', 'delegates')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        utils.expectDelegate(response.data.data[0])
      })
    })
  })

  describe('GET /delegates/:id', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET a delegate by the given username', async () => {
        const response = await utils[request](
          'GET',
          `delegates/${delegate.username}`,
        )
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        utils.expectDelegate(response.data.data, delegate)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET a delegate by the given address', async () => {
        const response = await utils[request](
          'GET',
          `delegates/${delegate.address}`,
        )
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        utils.expectDelegate(response.data.data, delegate)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET a delegate by the given public key', async () => {
        const response = await utils[request](
          'GET',
          `delegates/${delegate.publicKey}`,
        )
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        utils.expectDelegate(response.data.data, delegate)
      })
    })
  })

  describe('POST /delegates/search', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for delegates with a username that matches the given string', async () => {
        const response = await utils[request]('POST', 'delegates/search', {
          username: delegate.username,
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        utils.expectDelegate(response.data.data[0], delegate)
      })
    })
  })

  describe('GET /delegates/:id/blocks', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET all blocks for a delegate by the given identifier', async () => {
        // save a new block so that we can make the request with generatorPublicKey
        const block2 = new Block(blocks2to100[0])
        const database = container.resolvePlugin('database')
        await database.saveBlock(block2)

        const response = await utils[request](
          'GET',
          `delegates/${blocks2to100[0].generatorPublicKey}/blocks`,
        )
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()
        utils.expectBlock(response.data.data[0])

        await database.deleteBlock(block2) // reset to genesis block
      })
    })
  })

  describe('GET /delegates/:id/voters', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET all voters (wallets) for a delegate by the given identifier', async () => {
        const response = await utils[request](
          'GET',
          `delegates/${delegate.publicKey}/voters`,
        )
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        utils.expectWallet(response.data.data[0])
      })
    })
  })
})
