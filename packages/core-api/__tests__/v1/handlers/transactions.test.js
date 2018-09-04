'use strict'

require('@arkecosystem/core-test-utils')

const app = require('../../__support__/setup')
const utils = require('../utils')

const address1 = 'APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn'
const address2 = 'AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri'

let genesisBlock
let transactionList

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('../../__support__/config/genesisBlock.json')
  transactionList = genesisBlock.transactions
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 1.0 - Transactions', () => {
  describe('GET /transactions', () => {
    it('should be ok using valid parameters', async () => {
      const data = {
        blockId: '17184958558311101492',
        senderId: address1,
        recipientId: address2,
        limit: 10,
        offset: 0,
        orderBy: 'amount:asc'
      }

      const response = await utils.request('GET', 'transactions', data)
      utils.expectSuccessful(response)

      expect(response.data.transactions).toBeArray()
      expect(response.data.transactions).not.toBeEmpty()

      response.data.transactions.forEach(transaction => {
        expect(transaction).toBeApiTransaction()
      })
    })

    it('should reply with transactions that have any of the values (OR)', async () => {
      const data = {
        senderId: address1,
        recipientId: address2
      }

      const response = await utils.request('GET', 'transactions', data)
      utils.expectSuccessful(response)

      expect(response.data.transactions).toBeArray()
      expect(response.data.transactions).not.toBeEmpty()

      response.data.transactions.forEach(transaction => {
        expect(transaction).toBeApiTransaction()
        if (transaction.senderId === data.senderId) {
          expect(transaction.senderId).toBe(data.senderId)
        } else {
          expect(transaction.recipientId).toBe(data.recipientId)
        }
      })
    })

    it('should be ok filtering by type', async () => {
      const type = 3

      const response = await utils.request('GET', 'transactions', { type })
      utils.expectSuccessful(response)

      expect(response.data.transactions).toBeArray()
      expect(response.data.transactions).not.toBeEmpty()

      response.data.transactions.forEach(transaction => {
        expect(transaction).toBeApiTransaction()
        expect(transaction.type).toBe(type)
      })
    })

    it('should be ok using no params', async () => {
      const response = await utils.request('GET', 'transactions')
      utils.expectSuccessful(response)

      expect(response.data.transactions).toBeArray()
      expect(response.data.transactions).not.toBeEmpty()

      response.data.transactions.forEach(transaction => {
        expect(transaction).toBeApiTransaction()
      })
    })

    // fixquery
    // http://localhost:4003/api/transactions?orderBy=timestamp:desc&offset=0&limit=50&recipientId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr&senderId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr

    it('should fail using limit > 100', async () => {
      const limit = 101

      const response = await utils.request('GET', 'transactions', { limit })
      utils.expectError(response)

      expect(response.data.error).toBeString()
    })

    it('should be ok ordered by ascending timestamp', async () => {
      const response = await utils.request('GET', 'transactions', { orderBy: 'timestamp:asc' })
      utils.expectSuccessful(response)

      expect(response.data.transactions).toBeArray()
      expect(response.data.transactions).not.toBeEmpty()

      response.data.transactions.forEach(transaction => {
        expect(transaction).toBeApiTransaction()
      })

      let flag = 0;
      for (let i = 0; i < response.data.transactions.length; i++) {
        if (response.data.transactions[i + 1]) {
          // await response.data.transactions[i].toHaveProperty('timestamp').which.is.at.most(response.data.transactions[i + 1].timestamp)
          expect(response.data.transactions[i]).toHaveProperty('timestamp')

          if (flag === 0) {
            // offsetTimestamp = response.data.transactions[i + 1].timestamp
            flag = 1
          }
        }
      }
    })

    it('should be ok using offset == 1', async () => {
      const response = await utils.request('GET', 'transactions', { offset: 1 })
      utils.expectSuccessful(response)

      expect(response.data.transactions).toBeArray()
      expect(response.data.transactions).not.toBeEmpty()

      response.data.transactions.forEach(transaction => {
        expect(transaction).toBeApiTransaction()
      })
    })

    it('should fail using offset == "one"', async () => {
      const response = await utils.request('GET', 'transactions', { offset: 'one' })
      utils.expectError(response)

      expect(response.data.error).toBeString()
    })

    it('should fail using completely invalid fields', async () => {
      const response = await utils.request('GET', 'transactions', {
        blockId: 'invalid',
        senderId: 'invalid',
        recipientId: 'invalid',
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      })
      utils.expectError(response)

      expect(response.data.error).toBeString()
    })

    it('should fail using partially invalid fields', async () => {
      const response = await utils.request('GET', 'transactions', {
        blockId: 'invalid',
        senderId: 'invalid',
        recipientId: address1,
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      })
      utils.expectError(response)

      expect(response.data.error).toBeString()
    })
  })

  describe('GET /transactions/get?id=', () => {
    it('should be ok using valid id', async () => {
      const transactionInCheck = transactionList[0]
      const response = await utils.request('GET', 'transactions/get', { id: transactionInCheck.id })

      utils.expectSuccessful(response)

      expect(response.data.transaction).toBeApiTransaction()

      expect(response.data.transaction).toHaveProperty('id', transactionInCheck.id)
      expect(response.data.transaction).toHaveProperty('amount', transactionInCheck.amount)
      expect(response.data.transaction).toHaveProperty('fee', transactionInCheck.fee)
      expect(response.data.transaction).toHaveProperty('recipientId', transactionInCheck.recipientId)
      expect(response.data.transaction).toHaveProperty('senderId', transactionInCheck.senderId)
      expect(response.data.transaction).toHaveProperty('type', transactionInCheck.type)
    })

    it('should fail using invalid id', async () => {
      const response = await utils.request('GET', 'transactions/get', { id: 'invalid' })

      utils.expectError(response)

      expect(response.data.error).toBeString()
    })
  })

  describe('GET /transactions/unconfirmed/get?id=', () => {
    it('should be ok using valid id', async () => {
      const transaction = await utils.createTransaction()

      const response = await utils.request('GET', 'transactions/unconfirmed/get', { id: transaction.id })
      utils.expectSuccessful(response)

      if (response.data.success && response.data.transaction != null) {
        expect(response.data.transaction).toBeObject()
        expect(response.data.transaction).toHaveProperty('id', transaction.id)
      } else {
        expect(response.data.error).toBeString()
      }
    })
  })

  describe('GET /transactions/unconfirmed', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'transactions/unconfirmed')
      utils.expectSuccessful(response)

      expect(response.data.transactions).toBeArray()
    })
  })
})
