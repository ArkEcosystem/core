const app = require('../__support__/setup')
const utils = require('../__support__/utils')
require('@arkecosystem/core-test-utils/lib/matchers')

beforeAll(async () => {
  await app.setUp()
})

afterAll(() => {
  app.tearDown()
})

describe('GraphQL API { transactions }', () => {
  describe('GraphQL queries for Transactions - filter by fee', () => {
    it('should get all transactions with fee = 0', async () => {
      const query = '{ transactions(filter: { fee: 0 }) { id } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.transactions.length).toBe(100) // because of default limit = 100
    })

    it('should get no transaction with fee = 987', async () => {
      const query = '{ transactions(filter: { fee: 987 }) { id } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.transactions.length).toBe(0)
    })
  })

  describe.skip('GraphQL queries for Transactions - filter by blockId', () => {

  })

  describe.skip('GraphQL queries for Transactions - filter by senderPublicKey', () => {

  })

  describe.skip('GraphQL queries for Transactions - filter by recipientId', () => {

  })

  describe.skip('GraphQL queries for Transactions - filter by type', () => {

  })

  describe.skip('GraphQL queries for Transactions - using orderBy, limit', () => {

  })

  describe.skip('GraphQL queries for Transactions - testing relationships', () => {

  })

  describe.skip('GraphQL queries for Transactions - testing api errors', () => {
    // example: filter by column not defined in WalletFilter (lib/defs/inputs.js)
  })
})
