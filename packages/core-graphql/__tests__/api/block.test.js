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

describe('GraphQL API { block }', () => {
  describe('GraphQL queries for Block', () => {
    it('should get a block by its id', async () => {
      const query = `{ block(id:"${genesisBlock.id}") { id } }`
      const response = await utils.request(query)

      utils.expectSuccessful(response)
      utils.expectResource(response)

      const data = response.data.data
      expect(data.block).toBeObject()
      expect(data.block.id).toBe(genesisBlock.id)
    })
  })
})
