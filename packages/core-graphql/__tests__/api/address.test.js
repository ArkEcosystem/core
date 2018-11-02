const app = require('../__support__/setup')
const utils = require('../__support__/utils')
require('@arkecosystem/core-test-utils/lib/matchers')

let genesisBlock

beforeAll(async () => {
  await app.setUp()

  genesisBlock = require('@arkecosystem/core-test-utils/config/testnet/genesisBlock.json')
})

afterAll(() => {
  app.tearDown()
})

describe('GraphQL API { address }', () => {
  describe('GraphQL resolver for Address', () => {
    it('should get wallter for a correctly formatted Address', async () => {
      const query = `{ wallet(address: "APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn") { producedBlocks } }`
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.wallet).toBeObject()

      expect(data.wallet.producedBlocks).toBe(0)
    })
  })
})
