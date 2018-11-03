'use strict'

const { Block, Transaction } = require('@arkecosystem/crypto').models
const app = require('../__support__/setup')
const utils = require('../__support__/utils')

let genesisBlock
let genesisTransaction

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = new Block(require('@arkecosystem/core-test-utils/config/testnet/genesisBlock.json'))
  genesisTransaction = new Transaction(genesisBlock.transactions[0])
})

afterAll(async () => {
  await app.tearDown()
})

describe('API - Version 1', () => {
  describe('GET /peer/list', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/list')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTrue()

      expect(response.data).toHaveProperty('peers')
      expect(response.data.peers).toBeArray()
    })
  })

  describe.skip('GET /peer/blocks', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/blocks', { lastBlockHeight: 1 })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTrue()

      expect(response.data).toHaveProperty('blocks')
      expect(response.data.blocks).toBeArray()
    })

    it('should retrieve lastBlock if no "lastBlockHeight" specified', async () => {
      const response = await utils.GET('peer/blocks');

      expect(response.status).toBe(200);
      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTrue()

      expect(response.data).toHaveProperty('blocks')
      expect(response.data.blocks).toBeArray()
      expect(response.data.blocks).toHaveLength(1)
    })
  })

  describe('GET /peer/transactionsFromIds', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/transactionsFromIds', {
        ids: 'e40ce11cab82736da1cc91191716f3c1f446ca7b6a9f4f93b7120ef105ba06e8'
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTrue()

      expect(response.data).toHaveProperty('transactions')
      expect(response.data.transactions).toBeArray()
    })
  })

  describe('GET /peer/height', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/height')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTrue()

      expect(response.data).toHaveProperty('height')
      expect(response.data.height).toBeNumber()

      expect(response.data).toHaveProperty('id')
      expect(response.data.id).toBeString()
    })
  })

  describe('GET /peer/transactions', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/transactions')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTrue()

      expect(response.data).toHaveProperty('transactions')
      expect(response.data.transactions).toBeArray()
    })
  })

  describe('GET /peer/blocks/common', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/blocks/common', {
        ids: '17184958558311101492'
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTrue()
      expect(response.data).toHaveProperty('common')
      expect(response.data.common).toBeObject()
      expect(response.data.common.height).toBe(1)
      expect(response.data.common.id).toBe('17184958558311101492')

      expect(response.data).toHaveProperty('lastBlockHeight')
      expect(response.data.lastBlockHeight).toBeNumber()
    })
  })

  describe('GET /peer/status', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/status')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTrue()
    })
  })

  describe('POST /peer/blocks', () => {
    it('should be ok', async () => {
      const response = await utils.POST('peer/blocks', {
        block: genesisBlock.toJson()
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTrue()
    })
  })

  describe.skip('POST /peer/transactions', () => {
    it('should be ok', async () => {
      const response = await utils.POST('peer/transactions', {
        transactions: [genesisTransaction.toJson()]
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBeTrue()
    })
  })
})
