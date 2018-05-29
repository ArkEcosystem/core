'use strict'

require('../../__support__/setup')

const utils = require('../utils')
const genesisBlock = require('../../__support__/config/genesisBlock.json')

const Address1 = 'APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn'
const Address2 = 'AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri'

const transactionList = genesisBlock.transactions

describe('API 1.0 - Transactions', () => {
  describe('GET /transactions', () => {
    it('should be ok using valid parameters', async () => {
      const response = await utils.request('GET', 'transactions', {
        blockId: '17184958558311101492',
        senderId: Address1,
        recipientId: Address2,
        limit: 10,
        offset: 0,
        orderBy: 'amount:asc'
      })
      utils.expectSuccessful(response)

      expect(Array.isArray(response.data.transactions)).toBe(true)
    })

    it('should be ok using type', async () => {
      const type = 1

      const response = await utils.request('GET', 'transactions', {type})
      utils.expectSuccessful(response)

      expect(Array.isArray(response.data.transactions)).toBe(true)

      for (let i = 0; i < response.data.transactions.length; i++) {
        if (response.data.transactions[i]) {
          expect(response.data.transactions[i]).toHaveProperty('type', type)
        }
      }
    })

    it('should be ok using no params', async () => {
      const response = await utils.request('GET', 'transactions')
      utils.expectSuccessful(response)

      expect(Array.isArray(response.data.transactions)).toBe(true)

      for (let i = 0; i < response.data.transactions.length - 1; i++) {
      expect(response.data.transactions[i].amount).toBeNumber()
      }
    })

    // fixquery
    // http://localhost:4003/api/transactions?orderBy=timestamp:desc&offset=0&limit=50&recipientId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr&senderId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr

    it('should fail using limit > 100', async () => {
      let limit = 101
      let params = 'limit=' + limit

      const response = await utils.request('GET', 'transactions?' + params)
      utils.expectError(response)

      expect(response.data.error).toBeString()
    })

    it('should be ok ordered by ascending timestamp', async () => {
      const response = await utils.request('GET', 'transactions', { orderBy: 'timestamp:asc' })
      utils.expectSuccessful(response)

      expect(Array.isArray(response.data.transactions)).toBe(true)

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

      expect(Array.isArray(response.data.transactions)).toBe(true)
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
        recipientId: Address1,
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      })
      utils.expectError(response)

      expect(response.data.error).toBeString()
    })
  })

  describe('GET /transactions/get?id=3fd7fa4fda1ae97055996040b482efa81f420516fadf50cff508da2025e9b8b9', () => {
    it('should be ok using valid id', async () => {
      let transactionInCheck = transactionList[0]

      const response = await utils.request('GET', `transactions/get?id=${transactionInCheck.id}`)
      utils.expectSuccessful(response)

      expect(response.data.transaction).toBeObject()
      expect(response.data.transaction).toHaveProperty('id', transactionInCheck.id)
        // expect(response.data.transaction).toHaveProperty('amount', transactionInCheck.netSent)
        // expect(response.data.transaction).toHaveProperty('fee', transactionInCheck.fee)
      expect(response.data.transaction).toHaveProperty('recipientId', transactionInCheck.recipientId)
      expect(response.data.transaction).toHaveProperty('senderId', transactionInCheck.senderId)
      expect(response.data.transaction).toHaveProperty('type', transactionInCheck.type)
    })

    it('should fail using invalid id', async () => {
      let params = 'id=invalid';

      const response = await utils.request('GET', 'transactions/get?' + params)
      utils.expectError(response)

      expect(response.data.error).toBeString()
    })
  })

  describe.skip('GET /transactions/unconfirmed/get?id=', () => {
    it('should be ok using valid id', async () => {
      let params = 'id=' + transactionList[transactionList.length - 1].id

      const response = await utils.request('GET', 'transactions/unconfirmed/get?' + params)
      utils.expectSuccessful(response)

      if (response.data.success && response.data.transaction != null) {
        expect(response.data.transaction).toBeObject()
        expect(response.data.transaction).toHaveProperty('id', transactionList[transactionList.length - 1].id)
      } else {
        expect(response.data.error).toBeString()
      }
    })
  })

  describe.skip('GET /transactions/unconfirmed', () => {
    it('should be ok', async () => {
      const response = await utils.request('GET', 'transactions/unconfirmed')
      utils.expectSuccessful(response)

      expect(Array.isArray(response.data.transactions)).toBe(true)
    })
  })
})
