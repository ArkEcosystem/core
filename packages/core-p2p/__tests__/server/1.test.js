'use strict'

const axios = require('axios')

const app = require('../__support__/setup')

let genesisBlock
let genesisTransaction

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('../__fixtures__/genesisBlock')
  genesisTransaction = require('../__fixtures__/genesisTransaction')
})

afterAll(async () => {
  await app.tearDown()
})

const sendGET = async (endpoint, params = {}) => {
  return axios.get(`http://127.0.0.1:4002/${endpoint}`, { params })
}

const sendPOST = async (endpoint, params) => {
  return axios.post(`http://127.0.0.1:4002/${endpoint}`, params)
}

describe('API - Version 1', () => {
  describe('GET /peer/list', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/list')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()

      expect(response.data).toHaveProperty('peers')
      expect(response.data.peers).toBeArray()
    })
  })

  describe('GET /peer/blocks', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/blocks', { lastBlockHeight: 1 })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()

      expect(response.data).toHaveProperty('blocks')
      expect(response.data.blocks).toBeArray()
    })

    it('should retrieve lastBlock if no "lastBlockHeight" specified', async () => {
      const response = await sendGET('peer/blocks');

      expect(response.status).toBe(200);
      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()

      expect(response.data).toHaveProperty('blocks')
      expect(response.data.blocks).toBeArray()
      expect(response.data.blocks).toHaveLength(1)
    })
  })

  describe('GET /peer/transactionsFromIds', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/transactionsFromIds', {
        ids: 'e40ce11cab82736da1cc91191716f3c1f446ca7b6a9f4f93b7120ef105ba06e8'
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()

      expect(response.data).toHaveProperty('transactions')
      expect(response.data.transactions).toBeArray()
    })
  })

  describe('GET /peer/height', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/height')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()

      expect(response.data).toHaveProperty('height')
      expect(response.data.height).toBeNumber()

      expect(response.data).toHaveProperty('id')
      expect(response.data.id).toBeString()
    })
  })

  describe('GET /peer/transactions', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/transactions')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()

      expect(response.data).toHaveProperty('transactions')
      expect(response.data.transactions).toBeArray()
    })
  })

  describe('GET /peer/blocks/common', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/blocks/common', {
        ids: '13149578060728881902'
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()

      expect(response.data).toHaveProperty('common')
      expect(response.data.common).toBeObject()
      expect(response.data.common.height).toBe(1)
      expect(response.data.common.id).toBe('13149578060728881902')

      expect(response.data).toHaveProperty('lastBlockHeight')
      expect(response.data.lastBlockHeight).toBeNumber()
    })
  })

  describe('GET /peer/status', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/status')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()
    })
  })

  describe('POST /peer/blocks', () => {
    it('should be ok', async () => {
      const response = await sendPOST('peer/blocks', {
        block: genesisBlock.toBroadcastV1()
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTruthy()
    })
  })

  describe('POST /peer/transactions', () => {
    it('should be ok', async () => {
      const response = await sendPOST('peer/transactions', {
        transactions: [genesisTransaction.toBroadcastV1()]
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeFalsy()
    })
  })
})
