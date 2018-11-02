const app = require('../__support__/setup')
const utils = require('../__support__/utils')
require('@arkecosystem/core-test-utils/lib/matchers')

beforeAll(async () => {
  await app.setUp()
})

afterAll(() => {
  app.tearDown()
})

describe('GraphQL API { wallets }', () => {
  describe('GraphQL queries for Wallets - get all', () => {
    it('should get all wallets', async () => {
      const query = '{ wallets { address } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.wallets.length).toBe(53)
      // TODO why 53 ? From genesis block I can count 52, but there is an additional "AP6kAVdX1zQ3S8mfDnnHx9GaAohEqQUins" wallet. What did I miss ?
    })
  })

  describe('GraphQL queries for Wallets - filter by vote', () => {
    it('should get all wallets with specific vote', async () => {
      const query = '{ wallets(filter: { vote: "036f612457adc81041662e664ca4ae64f844b412065f2b7d2f9f7d305e59c908cd" }) { address } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.wallets.length).toBe(1)
    })

    it('should get no wallet with unknown vote', async () => {
      const query = '{ wallets(filter: { vote: "unknownPublicKey" }) { address } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.wallets.length).toBe(0)
    })
  })

  describe('GraphQL queries for Wallets - using orderBy, limit', () => {
    it('should get 5 wallets in order of ASCending address', async () => {
      const query = '{ wallets(orderBy: { field: "address", direction: ASC }, limit: 5 ) { address } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.wallets.length).toBe(5)
      expect(data.wallets.sort((a, b) => {
        return parseInt(a) <= parseInt(b) ? -1 : 0
      })).toEqual(data.wallets)
    })
  })

  describe('GraphQL queries for Wallets - testing relationships', () => {
    it('should verify that relationships are valid', async () => {
      const query = '{ wallets(limit: 1) { transactions { id } } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      expect(response.data.errors[0]).toBeObject() // relationships doesn't function well (unimplemented)
    })
  })

  describe('GraphQL queries for Wallets - testing api errors', () => {
    it('should not be a successful query', async () => {
      const query = '{ wallets(filter: { vers } ) { address } }'
      const response = await utils.request(query)

      expect(response).not.toBeSuccessfulResponse()

      const error = response.data.errors
      expect(error).toBeArray()
      expect(response.status).toEqual(400)
    })
  })
})
