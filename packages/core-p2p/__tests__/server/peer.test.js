'use strict'

require('@arkecosystem/core-test-utils/lib')

const app = require('../__support__/setup')
const utils = require('../__support__/utils')

let genesisBlock
let genesisTransaction

beforeAll(async () => {
  process.env.ARK_V2 = true

  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('../__fixtures__/genesisBlock')
  genesisTransaction = require('../__fixtures__/genesisTransaction')
})

afterAll(async () => {
  await app.tearDown()
})

describe('API P2P - Version 2', () => {
  describe('GET /peer/peers', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/peers')

      expect(response).toBeSuccessfulResponse()

      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeValidArrayOfPeers()
    })
  })

  describe('GET /peer/blocks', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/blocks', { height: 0 })

      expect(response).toBeSuccessfulResponse()

      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeValidArrayOfBlocks()
    })

    it('should retrieve lastBlock if no "lastBlockHeight" specified', async () => {
      const response = await utils.GET('peer/blocks')

      expect(response).toBeSuccessfulResponse()

      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeValidArrayOfBlocks()
      expect(response.data.data).toHaveLength(1)
    })
  })

  describe('GET /peer/blocks/common', () => {
    it('should be ok', async () => {
      const blockId = '13149578060728881902'
      const response = await utils.GET('peer/blocks/common', {
        blocks: blockId
      })

      expect(response).toBeSuccessfulResponse()

      expect(response.data).toHaveProperty('data')

      expect(response.data.data.common).toBeObject()
      expect(response.data.data.common.height).toBe(1)
      expect(response.data.data.common.id).toBe(blockId)

      expect(response.data.data).toHaveProperty('lastBlockHeight')
      expect(response.data.data.lastBlockHeight).toBeNumber()
    })
  })

  describe.skip('GET /peer/transactions', () => {
    // Looks like GET /peer/transactions is not implemented : returns [] see lib/server/versions/peer/handlers/transactions.js
    it('should be ok', async () => {
      const response = await utils.GET('peer/transactions')

      expect(response).toBeSuccessfulResponse()

      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeArray()
    })
  })

  describe('POST /peer/transactions/search', () => {
    it('should be ok', async () => {
      const response = await utils.POST('peer/transactions/search', {
        transactions: ['e40ce11cab82736da1cc91191716f3c1f446ca7b6a9f4f93b7120ef105ba06e8']
      })

      expect(response).toBeSuccessfulResponse()

      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeArray()
    })
  })

  describe('GET /blockchain/height', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/blockchain/height')

      expect(response).toBeSuccessfulResponse()

      expect(response.data).toHaveProperty('data')

      expect(response.data.data).toHaveProperty('height')
      expect(response.data.data.height).toBeNumber()

      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data.id).toBeString()
    })
  })

  describe('GET /blockchain/status', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/blockchain/status')

      expect(response).toBeSuccessfulResponse()
    })
  })

  describe('POST /peer/blocks', () => {
    it('should fail with status code 202 when posting existing block', async () => {
      const response = await utils.POST('peer/blocks', {
        block: genesisBlock.toBroadcastV1()
      })

      expect(response).toHaveProperty('status')
      expect(response.status).toBe(202)
    })
  })

  describe('POST /peer/transactions', () => {
    it('should fail with status code 406 when posting existing transaction', async () => {
      const response = await utils.POST('peer/transactions', {
        transactions: [genesisTransaction.toBroadcastV1()]
      })

      expect(response).toHaveProperty('status')
      expect(response.status).toBe(406)
    })
  })
})
