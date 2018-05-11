'use strict'

const axios = require('axios')

const app = require('../__support__/setup')
const genesisBlock = require('../__fixtures__/genesisBlock')
const genesisTransaction = require('../__fixtures__/genesisTransaction')

beforeAll(async (done) => {
  await app.setUp()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

const sendGET = async (endpoint, params = {}) => axios.get(`http://127.0.0.1:4002/${endpoint}`, { params })
const sendPOST = async (endpoint, params) => axios.post(`http://127.0.0.1:4002/${endpoint}`, params)

describe('API - Version 1', () => {
  describe('GET /peer/list', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/list')

      await expect(response.status).toBe(200)

      await expect(response.data).toBeObject()

      await expect(response.data).toHaveProperty('success')
      await expect(response.data.success).toBeTruthy()

      await expect(response.data).toHaveProperty('peers')
      await expect(response.data.peers).toBeArray()
    })
  })

  describe('GET /peer/blocks', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/blocks', { lastBlockHeight: 1 })

      await expect(response.status).toBe(200)

      await expect(response.data).toBeObject()

      await expect(response.data).toHaveProperty('success')
      await expect(response.data.success).toBeTruthy()

      await expect(response.data).toHaveProperty('blocks')
      await expect(response.data.blocks).toBeArray()
    })
  })

  describe('GET /peer/transactionsFromIds', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/transactionsFromIds', {
        ids: 'e40ce11cab82736da1cc91191716f3c1f446ca7b6a9f4f93b7120ef105ba06e8'
      })

      await expect(response.status).toBe(200)

      await expect(response.data).toBeObject()

      await expect(response.data).toHaveProperty('success')
      await expect(response.data.success).toBeTruthy()

      await expect(response.data).toHaveProperty('transactions')
      await expect(response.data.transactions).toBeArray()
    })
  })

  describe('GET /peer/height', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/height')

      await expect(response.status).toBe(200)

      await expect(response.data).toBeObject()

      await expect(response.data).toHaveProperty('success')
      await expect(response.data.success).toBeTruthy()

      await expect(response.data).toHaveProperty('height')
      await expect(response.data.height).toBeNumber()

      await expect(response.data).toHaveProperty('id')
      await expect(response.data.id).toBeNumber()
    })
  })

  describe('GET /peer/transactions', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/transactions')

      await expect(response.status).toBe(200)

      await expect(response.data).toBeObject()

      await expect(response.data).toHaveProperty('success')
      await expect(response.data.success).toBeTruthy()

      await expect(response.data).toHaveProperty('transactions')
      await expect(response.data.transactions).toBeArray()
    })
  })

  describe('GET /peer/blocks/common', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/blocks/common', {
        ids: '13149578060728881902'
      })

      await expect(response.status).toBe(200)

      await expect(response.data).toBeObject()

      await expect(response.data).toHaveProperty('success')
      await expect(response.data.success).toBeTruthy()

      await expect(response.data).toHaveProperty('common')
      await expect(response.data.common).toBeObject()
      await expect(response.data.common.height).toBe(1)
      await expect(response.data.common.id).toBe('13149578060728881902')

      await expect(response.data).toHaveProperty('lastBlockHeight')
      await expect(response.data.lastBlockHeight).toBeNumber()
    })
  })

  describe('GET /peer/status', async () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/status')

      await expect(response.status).toBe(200)

      await expect(response.data).toBeObject()

      await expect(response.data).toHaveProperty('success')
      await expect(response.data.success).toBeTruthy()
    })
  })

  describe('POST /peer/blocks', async () => {
    it('should be ok', async () => {
      const response = await sendPOST('peer/blocks', {
        block: genesisBlock.toBroadcastV1()
      })

      await expect(response.status).toBe(200)

      await expect(response.data).toBeObject()

      await expect(response.data).toHaveProperty('success')
      await expect(response.data.success).toBeTruthy()
    })
  })

  describe('POST /peer/transactions', async () => {
    it('should be ok', async () => {
      const response = await sendPOST('peer/transactions', {
        transactions: [genesisTransaction.toBroadcastV1()]
      })

      await expect(response.status).toBe(200)

      await expect(response.data).toBeObject()

      await expect(response.data).toHaveProperty('success')
      await expect(response.data.success).toBeTruthy()
    })
  })
})
