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

describe('GraphQL API { transactions }', () => {
  describe('GraphQL queries for Transactions - all', () => {
    it('should get 100 transactions', async () => {
      const query = '{ transactions { id } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.transactions.length).toBe(100)
    })
  })

  describe('GraphQL queries for Transactions - orderBy', () => {
    it('should get 100 transactionsin ascending order of their id', async () => {
      const query = '{ transactions(orderBy: { field: "id", direction: ASC }) { id } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.transactions.length).toBe(100)
      expect(data.transactions.sort((a, b) => {
        return parseInt(a) <= parseInt(b) ? -1 : 0
      })).toEqual(data.transactions)
    })
  })

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

  describe('GraphQL queries for Transactions - filter by blockId', () => {
    it('should get transactions for given blockId', async () => {
      const query = `{ transactions(filter: { blockId: "${genesisBlock.id}" }) { id } }`
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()

      const genesisBlockTransactionIds = genesisBlock.transactions.map(transaction => {
        return transaction.id
      })
      data.transactions.forEach(transaction => {
        expect(genesisBlockTransactionIds).toContain(transaction.id)
      })
    })
  })

  describe('GraphQL queries for Transactions - filter by senderPublicKey', () => {
    it('should get transactions for given senderPublicKey', async () => {
      const query = `{ transactions(filter: { senderPublicKey: "${genesisBlock.transactions[0].senderPublicKey}" }) { id } }`
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.transactions.length).toEqual(51) // number of outgoing transactions for the 0th transaction's sender address

      const genesisBlockTransactionIds = genesisBlock.transactions.map(transaction => {
        return transaction.id
      })

      data.transactions.forEach(transaction => {
        expect(genesisBlockTransactionIds).toContain(transaction.id)
      })
    })
  })

  describe('GraphQL queries for Transactions - filter by recipientId', () => {
    it('should get transactions for given recipientId', async () => {
      const query = '{ transactions(filter: { recipientId: "AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri" }) { id } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()

      expect(data.transactions.length).toBe(2)
    })
  })

  describe('GraphQL queries for Transactions - filter by type', () => {
    it('should get transactions for given type', async () => {
      const query = '{ transactions(filter: { type: TRANSFER } ) { type } }'
      const response = await utils.request(query)
      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()

      data.transactions.forEach(tx => {
        expect(tx.type).toBe(Number(0))
      })
    })
  })

  describe('GraphQL queries for Transactions - using orderBy, limit', () => {
    it('should get 5 transactions in order of ASCending address', async () => {
      const query = '{ transactions(orderBy: { field: "id", direction: ASC }, limit: 5 ) { id } }'
      const response = await utils.request(query)
      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.transactions.length).toBe(5)

      expect(parseInt(data.transactions[0].id, 16)).toBeLessThan(parseInt(data.transactions[1].id, 16))
    })
  })

  describe('GraphQL queries for Transactions - testing relationships', () => {
    it('should verify that relationships are valid', async () => {
      const query = '{ transactions(limit: 1) { recipient { address } } }'
      const response = await utils.request(query)

      expect(response).toBeSuccessfulResponse()

      const data = response.data.data
      expect(data).toBeObject()
      expect(data.transactions[0].recipient.address).not.toBeNull()
    })
  })

  describe('GraphQL queries for Transactions - testing api errors', () => {
    it('should not be a successful query', async () => {
      const query = '{ transaction(filter: { vers } ) { id } }'
      const response = await utils.request(query)

      expect(response).not.toBeSuccessfulResponse()

      const error = response.data.errors
      expect(error).toBeArray()
      expect(response.status).toEqual(400)
    })
  })
})
