const app = require('../__support__/setup')
const utils = require('../__support__/utils')

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

      utils.expectSuccessful(response)
      utils.expectResource(response)

      const data = response.data.data
      expect(data.wallets.length).toBe(53)
      // TODO why 53 ? From genesis block I can count 52, but there is an additional "AP6kAVdX1zQ3S8mfDnnHx9GaAohEqQUins" wallet. What did I miss ?
    })
  })

  describe('GraphQL queries for Wallets - filter by vote', () => {
    it('should get all wallets with specific vote', async () => {
      const query = '{ wallets(filter: { vote: "036f612457adc81041662e664ca4ae64f844b412065f2b7d2f9f7d305e59c908cd" }) { address } }'
      const response = await utils.request(query)

      utils.expectSuccessful(response)
      utils.expectResource(response)

      const data = response.data.data
      expect(data.wallets.length).toBe(1)
    })

    it('should get no wallet with unknown vote', async () => {
      const query = '{ wallets(filter: { vote: "unknownPublicKey" }) { address } }'
      const response = await utils.request(query)

      utils.expectSuccessful(response)
      utils.expectResource(response)

      const data = response.data.data
      expect(data.wallets.length).toBe(0)
    })
  })

  describe.skip('GraphQL queries for Wallets - using orderBy, limit', () => {

  })

  describe.skip('GraphQL queries for Wallets - testing relationships', () => {

  })

  describe.skip('GraphQL queries for Wallets - testing api errors', () => {
    // example: filter by column not defined in WalletFilter (lib/defs/inputs.js)
  })
})
