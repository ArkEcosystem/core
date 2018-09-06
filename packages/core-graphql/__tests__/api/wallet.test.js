const app = require('../__support__/setup')
const utils = require('../__support__/utils')

let genesisBlock

beforeAll(async () => {
  await app.setUp()

  genesisBlock = require('../__fixtures__/genesisBlock.json')
})

afterAll(() => {
  app.tearDown()
})

describe('GraphQL API { wallet }', () => {
  describe('GraphQL queries for Wallet', () => {
    it('should get a wallet by address', async () => {
      const query = `{ wallet(address:"${genesisBlock.transactions[0].senderId}") { address } }`
      const response = await utils.request(query)

      utils.expectSuccessful(response)
      utils.expectResource(response)

      const data = response.data.data
      expect(data.wallet).toBeObject()
      expect(data.wallet.address).toBe(genesisBlock.transactions[0].senderId)
    })
  })
})
