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

describe('GraphQL API { blocks }', () => {
  describe('GraphQL queries for Blocks - filter by generatorPublicKey', () => {
    it('should get blocks by generatorPublicKey', async () => {
      const query = `{ blocks(filter: { generatorPublicKey: "${genesisBlock.generatorPublicKey}" }) { id } }`
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.blocks).toEqual([ { id: genesisBlock.id } ])
    })
  })

  describe.skip('GraphQL queries for Blocks - testing relationships', () => {

  })

  describe.skip('GraphQL queries for Blocks - testing api errors', () => {
    // example: filter by column not defined in WalletFilter (lib/defs/inputs.js)
  })
})
