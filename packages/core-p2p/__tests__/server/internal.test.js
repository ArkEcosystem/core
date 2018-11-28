const { Block, Transaction } = require('@arkecosystem/crypto').models
const genTransfer = require('@arkecosystem/core-test-utils/lib/generators/transactions/transfer')
const blockFixture = require('../../../core-debugger-cli/__tests__/__fixtures__/block.json')
const app = require('../__support__/setup')
const utils = require('../__support__/utils')

let genesisBlock
let genesisTransaction

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = new Block(
    require('@arkecosystem/core-test-utils/config/testnet/genesisBlock.json'),
  )
  genesisTransaction = new Transaction(genesisBlock.transactions[0])
})

beforeEach(() => {
  utils.headers['x-auth'] = 'forger'
})

afterAll(async () => {
  delete utils.headers['x-auth']
  await app.tearDown()
})

describe('API - Internal', () => {
  describe('GET /rounds/current', () => {
    it('should be ok', async () => {
      const response = await utils.GET('internal/rounds/current')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })

    it('should return 403 without x-auth', async () => {
      delete utils.headers['x-auth']
      const response = await utils.GET('internal/rounds/current')

      expect(response.status).toBe(403)
    })
  })

  describe('POST /blocks', () => {
    it('should be ok', async () => {
      const block = new Block(blockFixture.data)
      const response = await utils.POST('internal/blocks', {
        block: block.toJson(),
      })
      expect(response.status).toBe(204)
    })

    it('should return 403 without x-auth', async () => {
      delete utils.headers['x-auth']
      const response = await utils.POST('internal/blocks', {
        block: genesisBlock.toJson(),
      })

      expect(response.status).toBe(403)
    })
  })

  describe('POST /transactions/verify', () => {
    it('should be ok', async () => {
      const transaction = genTransfer('testnet')[0]
      const response = await utils.POST('internal/transactions/verify', {
        transaction: Transaction.serialize(transaction).toString('hex'),
      })

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })

    it('should return 403 without x-auth', async () => {
      delete utils.headers['x-auth']
      const response = await utils.POST('internal/transactions/verify', {
        transaction: genesisTransaction,
      })

      expect(response.status).toBe(403)
    })
  })

  describe('GET /transactions/forging', () => {
    it('should be ok', async () => {
      const response = await utils.GET('internal/transactions/forging')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })

    it('should return 403 without x-auth', async () => {
      delete utils.headers['x-auth']
      const response = await utils.GET('internal/transactions/forging')

      expect(response.status).toBe(403)
    })
  })

  describe('GET /network/state', () => {
    it('should be ok', async () => {
      const response = await utils.GET('internal/network/state')

      expect(response.status).toBe(200)

      expect(response.data).toBeObject()

      expect(response.data).toHaveProperty('data')
    })

    it('should return 403 without x-auth', async () => {
      delete utils.headers['x-auth']
      const response = await utils.GET('internal/network/state')

      expect(response.status).toBe(403)
    })
  })
})
