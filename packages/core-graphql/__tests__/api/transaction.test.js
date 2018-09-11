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

describe('GraphQL API { transaction }', () => {
  describe('GraphQL queries for Transaction', () => {
    it('should get a transaction by its id', async () => {
      const query = `{ transaction(id:"${genesisBlock.transactions[0].id}") { id } }`
      const response = await utils.request(query)

      utils.expectSuccessful(response)
      utils.expectResource(response)

      const data = response.data.data
      expect(data.transaction).toBeObject()
      expect(data.transaction.id).toBe(genesisBlock.transactions[0].id)
    })
  })
})
