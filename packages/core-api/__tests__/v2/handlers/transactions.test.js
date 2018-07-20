'use strict'

require('../../__support__/setup')

const utils = require('../utils')
const genesisBlock = require('../../__support__/config/genesisBlock.json')
const genesisTransactions = genesisBlock.transactions[0]

const transactionId = genesisTransactions.id
const blockId = genesisBlock.id
const type = genesisTransactions.type
const wrongType = 3
const version = 1
const senderPublicKey = genesisTransactions.senderPublicKey
const senderAddress = genesisTransactions.senderId
const recipientAddress = genesisTransactions.recipientId
const timestamp = genesisTransactions.timestamp
const timestampFrom = timestamp
const timestampTo = timestamp
const amount = genesisTransactions.amount
const amountFrom = amount
const amountTo = amount
const fee = genesisTransactions.fee
const feeFrom = fee
const feeTo = fee

describe('API 2.0 - Transactions', () => {
  describe('GET /transactions', () => {
    it('should GET all the transactions', async () => {
      const response = await utils.request('GET', 'transactions')
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      utils.expectTransaction(response.data.data[0])
    })
  })

  describe('GET /transactions/:id', () => {
    it('should GET a transaction by the given identifier', async () => {
      const response = await utils.request('GET', `transactions/${transactionId}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      const transaction = response.data.data
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
    })
  })

  describe('GET /transactions/unconfirmed', () => {
    it('should GET all the unconfirmed transactions', async () => {
      await utils.createTransaction()

      const response = await utils.request('GET', 'transactions/unconfirmed')
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toBeArray()
      expect(response.data.data).not.toBeEmpty()
    })
  })

  describe('GET /transactions/unconfirmed/:id', () => {
    it('should GET an unconfirmed transaction by the given identifier', async () => {
      const transaction = await utils.createTransaction()

      const response = await utils.request('GET', `transactions/unconfirmed/${transaction.id}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.data.data).toHaveProperty('id', transaction.id)
    })
  })

  describe('POST /transactions/search', () => {
    it('should POST a search for transactions with the exact specified transactionId', async () => {
      const response = await utils.request('POST', 'transactions/search', { id: transactionId })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the exact specified blockId', async () => {
      const response = await utils.request('POST', 'transactions/search', { blockId })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
      expect(transaction.blockId).toBe(blockId)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the exact specified type', async () => {
      const response = await utils.request('POST', 'transactions/search', { type })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
      expect(transaction.type).toBe(type)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the exact specified version', async () => {
      const response = await utils.request('POST', 'transactions/search', { version })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the exact specified senderPublicKey', async () => {
      const response = await utils.request('POST', 'transactions/search', { senderPublicKey })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
      expect(transaction.sender).toBe(senderAddress)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the exact specified senderId', async () => {
      const response = await utils.request('POST', 'transactions/search', { senderId: senderAddress })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
      expect(transaction.sender).toBe(senderAddress)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the exact specified recipientId (Address)', async () => {
      const response = await utils.request('POST', 'transactions/search', { recipientId: recipientAddress })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
      expect(transaction.recipient).toBe(recipientAddress)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the exact specified timestamp', async () => {
      const response = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        timestamp: {
          from: timestamp,
          to: timestamp
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the specified timestamp range', async () => {
      const response = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        timestamp: {
          from: timestampFrom,
          to: timestampTo
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the exact specified amount', async () => {
      const response = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        amount: {
          from: amount,
          to: amount
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the specified amount range', async () => {
      const response = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        amount: {
          from: amountFrom,
          to: amountTo
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the exact specified fee', async () => {
      const response = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        fee: {
          from: fee,
          to: fee
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
    })

    // TODO remove the search by id, to be sure that is OK
    it('should POST a search for transactions with the specified fee range', async () => {
      const response = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        fee: {
          from: feeFrom,
          to: feeTo
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
    })

    // TODO remove the search by id, to be sure that is OK
    it.skip('should POST a search for transactions with the exact specified vendorFieldHex', async () => {
      const transactionId = '0000faa27b422f7648b1a2f634f15c7e5c8e96b84929624fda44abf716bdf784'
      const vendorFieldHex = '64656c65676174653a20766f746572732073686172652e205468616e6b20796f7521207c74782062792061726b2d676f'

      const response = await utils.request('POST', 'transactions/search', { id: transactionId, vendorFieldHex })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(1)

      const transaction = response.data.data[0]
      utils.expectTransaction(transaction)
      expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the wrong specified type', async () => {
      const response = await utils.request('POST', 'transactions/search', { id: transactionId, type: wrongType })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toHaveLength(0)
    })

    it('should POST a search for transactions with the specific criteria', async () => {
      const response = await utils.request('POST', 'transactions/search', {
        senderPublicKey,
        type,
        timestamp: {
          from: timestampFrom,
          to: timestampTo
        }
      })
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data).toBeArray()
      utils.expectTransaction(response.data.data[0])
    })
  })
})
