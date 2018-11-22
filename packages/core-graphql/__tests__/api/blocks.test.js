const app = require('../__support__/setup')
const utils = require('../__support__/utils')
require('@phantomchain/core-test-utils/lib/matchers')

let genesisBlock

beforeAll(async () => {
  await app.setUp()

  genesisBlock = require('@phantomchain/core-test-utils/config/testnet/genesisBlock.json')
})

afterAll(() => {
  app.tearDown()
})

describe('GraphQL API { blocks }', () => {
  describe('GraphQL queries for Blocks - filter by generatorPublicKey', () => {
    it('should get blocks by generatorPublicKey', async () => {
      const query = `{ blocks(filter: { generatorPublicKey: "${
        genesisBlock.generatorPublicKey
      }" }) { id } }`
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.blocks).toEqual([{ id: genesisBlock.id }])
    })
  })

  describe('GraphQL queries for Blocks - testing relationships', () => {
    it('should verify that relationships are valid', async () => {
      const query = '{ blocks(limit: 1) { generator { address } } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.blocks[0].generator.address).toEqual(
        'Ac9dCo9dFgAkkBdEBsoRAN4Mm6xMsgYdZx',
      )
    })
  })

  describe('GraphQL queries for Blocks - testing api errors', () => {
    it('should not be a successful query', async () => {
      const query = '{ blocks(filter: { vers } ) { id } }'
      const response = await utils.request(query)

      expect(response).not.toBeSuccessfulResponse()

      const error = response.data.errors
      expect(error).toBeArray()
      expect(response.status).toEqual(400)
    })
  })
})
