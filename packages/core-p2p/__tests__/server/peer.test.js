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
  describe('GET /peers', () => {
    it('should be ok', async () => {
      const response = await sendGET('peers')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeObject()
    })
  })

  describe('GET /peer/blocks', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/blocks', { lastBlockHeight: 1 })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeObject()
    })

    it('should retrieve lastBlock if no "lastBlockHeight" specified', async () => {
      const response = await sendGET('peer/blocks');

      expect(response.status).toBe(200);
      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeObject()
      expect(response.data.data).toHaveLength(1)
    })
  })

  describe('POST /peer/transactions/search', () => {
    it('should be ok', async () => {
      const response = await sendPOST('peer/transactions/search', {
        ids: 'e40ce11cab82736da1cc91191716f3c1f446ca7b6a9f4f93b7120ef105ba06e8'
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeObject()
    })
  })

  describe('GET /blockchain/height', () => {
    it('should be ok', async () => {
      const response = await sendGET('blockchain/height')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')

      expect(response.data.data).toHaveProperty('height')
      expect(response.data.data.height).toBeNumber()

      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data.id).toBeString()
    })
  })

  describe('GET /peer/transactions', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/transactions')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeObject()
    })
  })

  describe('GET /peer/blocks/common', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/blocks/common', {
        ids: '13149578060728881902'
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')

      expect(response.data.data).toHaveProperty('common')
      expect(response.data.data.common).toBeObject()
      expect(response.data.data.common.height).toBe(1)
      expect(response.data.data.common.id).toBe('13149578060728881902')

      expect(response.data.data).toHaveProperty('lastBlockHeight')
      expect(response.data.data.lastBlockHeight).toBeNumber()
    })
  })

  describe('GET /peer/blockchain/status', () => {
    it('should be ok', async () => {
      const response = await sendGET('peer/blockchain/status')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })

  describe('POST /peer/blocks', () => {
    it('should be ok', async () => {
      const response = await sendPOST('peer/blocks', {
        block: genesisBlock.toBroadcastV1()
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })

  describe('POST /peer/transactions', () => {
    it('should be ok', async () => {
      const response = await sendPOST('peer/transactions', {
        transactions: [genesisTransaction.toBroadcastV1()]
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })
  })
})
