'use strict'

require('@arkecosystem/core-test-utils/lib/matchers')
const generateTransfers = require('@arkecosystem/core-test-utils/lib/generators/transactions/transfer')
const delegates = require('@arkecosystem/core-test-utils/fixtures/testnet/delegates')
const app = require('../../__support__/setup')
const utils = require('../utils')

let genesisBlock
let genesisTransactions

let transactionId
let blockId
let type
let wrongType
let version
let senderPublicKey
let senderAddress
let recipientAddress
let timestamp
let timestampFrom
let timestampTo
let amount
let amountFrom
let amountTo
let fee
let feeFrom
let feeTo

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('@arkecosystem/core-test-utils/config/testnet/genesisBlock.json')
  genesisTransactions = genesisBlock.transactions[0]

  transactionId = genesisTransactions.id
  blockId = genesisBlock.id
  type = genesisTransactions.type
  wrongType = 3
  version = 1
  senderPublicKey = genesisTransactions.senderPublicKey
  senderAddress = genesisTransactions.senderId
  recipientAddress = genesisTransactions.recipientId
  timestamp = genesisTransactions.timestamp
  timestampFrom = timestamp
  timestampTo = timestamp
  amount = genesisTransactions.amount
  amountFrom = amount
  amountTo = amount
  fee = genesisTransactions.fee
  feeFrom = fee
  feeTo = fee
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 2.0 - Transactions', () => {
  describe('GET /transactions', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET all the transactions', async () => {
        const response = await utils[request]('GET', 'transactions')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        utils.expectTransaction(response.data.data[0])
      })
    })
  })

  describe('GET /transactions/:id', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET a transaction by the given identifier', async () => {
        const response = await utils[request]('GET', `transactions/${transactionId}`)
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        const transaction = response.data.data
        utils.expectTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
      })
    })
  })

  describe('GET /transactions/unconfirmed', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET all the unconfirmed transactions', async () => {
        await utils.createTransaction()

        const response = await utils[request]('GET', 'transactions/unconfirmed')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toBeArray()
        expect(response.data.data).not.toBeEmpty()
      })
    })
  })

  describe('GET /transactions/unconfirmed/:id', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should GET an unconfirmed transaction by the given identifier', async () => {
        const transaction = await utils.createTransaction()

        const response = await utils[request]('GET', `transactions/unconfirmed/${transaction.id}`)
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        expect(response.data.data).toHaveProperty('id', transaction.id)
      })
    })
  })

  describe('POST /transactions/search', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified transactionId', async () => {
        const response = await utils[request]('POST', 'transactions/search', { id: transactionId })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        const transaction = response.data.data[0]
        utils.expectTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified blockId', async () => {
        const response = await utils[request]('POST', 'transactions/search', { blockId })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(100)
        expect(response.data.meta.totalCount).toBe(153)

        const transaction = response.data.data[0]
        utils.expectTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
        expect(transaction.blockId).toBe(blockId)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified type', async () => {
        const response = await utils[request]('POST', 'transactions/search', { type })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(51)

        const transaction = response.data.data[0]
        utils.expectTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
        expect(transaction.type).toBe(type)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified version', async () => {
        const response = await utils[request]('POST', 'transactions/search', { version })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(100)
        expect(response.data.meta.totalCount).toBe(153)

        const transaction = response.data.data[0]
        utils.expectTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified senderPublicKey', async () => {
        const response = await utils[request]('POST', 'transactions/search', { senderPublicKey })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()

        let genesisTransactions = {}
        genesisBlock.transactions.forEach(transaction => {
          genesisTransactions[transaction.id] = true
        })
        const failed = data.some(transaction => {
          if (!genesisTransactions[transaction.id]) return true
        })

        expect(!failed).toBeTrue()
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified senderId', async () => {
        const response = await utils[request]('POST', 'transactions/search', { senderId: senderAddress })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()

        let genesisTransactions = {}
        genesisBlock.transactions.forEach(transaction => {
          genesisTransactions[transaction.id] = true
        })
        const failed = data.some(transaction => {
          if (!genesisTransactions[transaction.id]) return true
        })

        expect(!failed).toBeTrue()
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified recipientId (Address)', async () => {
        const response = await utils[request]('POST', 'transactions/search', { recipientId: recipientAddress })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(2)

        const transaction = response.data.data[0]
        utils.expectTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
        expect(transaction.recipient).toBe(recipientAddress)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified timestamp', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          timestamp: {
            from: timestamp,
            to: timestamp
          }
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data.length).toEqual(100)

        data.forEach(transaction => {
          utils.expectTransaction(transaction)
        })

        let genesisTransactions = {}
        genesisBlock.transactions.forEach(transaction => {
          genesisTransactions[transaction.id] = true
        })
        const failed = data.some(transaction => {
          if (!genesisTransactions[transaction.id]) return true
        })

        expect(!failed).toBeTrue()
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the specified timestamp range', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          timestamp: {
            from: timestampFrom,
            to: timestampTo
          }
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data).toHaveLength(100)

        data.forEach(transaction => {
          utils.expectTransaction(transaction)
        })

        let genesisTransactions = {}
        genesisBlock.transactions.forEach(transaction => {
          genesisTransactions[transaction.id] = true
        })
        const failed = data.some(transaction => {
          if (!genesisTransactions[transaction.id]) return true
        })

        expect(!failed).toBeTrue()
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified amount', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          amount: {
            from: amount,
            to: amount
          }
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data).toHaveLength(50)

        data.forEach(transaction => {
          utils.expectTransaction(transaction)
        })

        let genesisTransactions = {}
        genesisBlock.transactions.forEach(transaction => {
          genesisTransactions[transaction.id] = true
        })
        const failed = data.some(transaction => {
          if (!genesisTransactions[transaction.id]) {
            return true
          }
        })

        expect(!failed).toBeTrue()
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the specified amount range', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          amount: {
            from: amountFrom,
            to: amountTo
          }
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data).toHaveLength(50)

        data.forEach(transaction => {
          utils.expectTransaction(transaction)
        })

        let genesisTransactions = {}
        genesisBlock.transactions.forEach(transaction => {
          genesisTransactions[transaction.id] = true
        })
        const failed = data.some(transaction => {
          if (!genesisTransactions[transaction.id]) return true
        })

        expect(!failed).toBeTrue()
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified fee', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          fee: {
            from: fee,
            to: fee
          }
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data).toHaveLength(100)

        data.forEach(transaction => {
          utils.expectTransaction(transaction)
        })

        let genesisTransactions = {}
        genesisBlock.transactions.forEach(transaction => {
          genesisTransactions[transaction.id] = true
        })
        const failed = data.some(transaction => {
          if (!genesisTransactions[transaction.id]) return true
        })

        expect(!failed).toBeTrue()
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the specified fee range', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          fee: {
            from: feeFrom,
            to: feeTo
          }
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data).toHaveLength(100)

        data.forEach(transaction => {
          utils.expectTransaction(transaction)
        })

        let genesisTransactions = {}
        genesisBlock.transactions.forEach(transaction => {
          genesisTransactions[transaction.id] = true
        })
        const failed = data.some(transaction => {
          if (!genesisTransactions[transaction.id]) return true
        })

        expect(!failed).toBeTrue()
      })
    })

    // TODO remove the search by id, to be sure that is OK
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it.skip('should POST a search for transactions with the exact specified vendorFieldHex', async () => {
        const transactionId = '0000faa27b422f7648b1a2f634f15c7e5c8e96b84929624fda44abf716bdf784'
        const vendorFieldHex = '64656c65676174653a20766f746572732073686172652e205468616e6b20796f7521207c74782062792061726b2d676f'

        const response = await utils[request]('POST', 'transactions/search', { id: transactionId, vendorFieldHex })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        const transaction = response.data.data[0]
        utils.expectTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the wrong specified type', async () => {
        const response = await utils[request]('POST', 'transactions/search', { id: transactionId, type: wrongType })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(0)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader']
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the specific criteria', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          senderPublicKey,
          type,
          timestamp: {
            from: timestampFrom,
            to: timestampTo
          }
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        utils.expectTransaction(response.data.data[0])
      })
    })
  })

  describe('POST /transactions', () => {
    it('should POST 2 transactions double spending and get only 1 accepted and broadcasted', async () => {
      const amount = 245098000000000 - 5098000000000 // a bit less than the delegates' balance
      const transactions = generateTransfers('testnet', delegates[0].secret, delegates[1].address, amount, 2, true)
      const response = await utils.requestWithAcceptHeader('POST', 'transactions', {
        transactions
      })

      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeObject()

      expect(response.data.data.accept.length).toBe(1)
      expect(response.data.data.accept[0]).toBe(transactions[0].id)

      expect(response.data.data.broadcast.length).toBe(1)
      expect(response.data.data.broadcast[0]).toBe(transactions[0].id)

      expect(response.data.data.invalid.length).toBe(1)
      expect(response.data.data.invalid[0]).toBe(transactions[1].id)
    })
  })
})
