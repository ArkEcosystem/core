'use strict'

const blockchainHelper = require('@arkecosystem/core-test-utils/lib/helpers/blockchain')
const generateTransfers = require('@arkecosystem/core-test-utils/lib/generators/transactions/transfer')
const generateWallets = require('@arkecosystem/core-test-utils/lib/generators/wallets')
const delegates = require('@arkecosystem/core-test-utils/fixtures/testnet/delegates')
const { client } = require('@arkecosystem/crypto')
const { Block } = require('@arkecosystem/crypto').models
require('@arkecosystem/core-test-utils/lib/matchers')

const app = require('../__support__/setup')
const utils = require('../__support__/utils')
const transferFee = 10000000

let genesisBlock

const blocks2to100 = require('@arkecosystem/core-test-utils/fixtures/testnet/blocks.2-100')

beforeAll(async () => {
  process.env.ARK_V2 = true

  await app.setUp()

  await blockchainHelper.resetBlockchain()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = new Block(require('@arkecosystem/core-test-utils/config/testnet/genesisBlock.json'))
})

afterAll(async () => {
  await blockchainHelper.resetBlockchain()

  await app.tearDown()
})

describe('API P2P - Version 2', () => {
  describe('GET /peer/peers', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/peers')

      expect(response).toBeSuccessfulResponse()

      expect(response.headers.height).toBe(1)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeValidArrayOfPeers()
    })
  })

  describe('GET /peer/blocks', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/blocks', { height: 0 })

      expect(response).toBeSuccessfulResponse()

      expect(response.headers.height).toBe(1)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeValidArrayOfBlocks()
    })

    it('should retrieve lastBlock if no "lastBlockHeight" specified', async () => {
      const response = await utils.GET('peer/blocks')

      expect(response).toBeSuccessfulResponse()

      expect(response.headers.height).toBe(1)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeValidArrayOfBlocks()
      expect(response.data.data).toHaveLength(1)
    })
  })

  describe('GET /peer/blocks/common', () => {
    it('should be ok', async () => {
      const blockId = '17184958558311101492'
      const response = await utils.GET('peer/blocks/common', {
        blocks: blockId
      })

      expect(response).toBeSuccessfulResponse()

      expect(response.headers.height).toBe(1)
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

      expect(response.headers.height).toBe(1)
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

      expect(response.headers.height).toBe(1)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toBeArray()
    })
  })

  describe('GET /blockchain/height', () => {
    it('should be ok', async () => {
      const response = await utils.GET('peer/blockchain/height')

      expect(response).toBeSuccessfulResponse()

      expect(response.headers.height).toBe(1)
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
      expect(response.headers.height).toBe(1)
    })
  })

  describe('POST /peer/transactions', () => {
    it('should add the transaction and return 200 when posting new valid transaction', async () => {
      const transaction = client.getBuilder().transfer()
        .recipientId('APRiwbs17FdbaF8DYU9js2jChRehQc2e6P')
        .amount(1000)
        .vendorField('Test Transaction')
        .sign('clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire')
        .getStruct()

      const response = await utils.POST('peer/transactions', {
        transactions: [ transaction ]
      })

      expect(response).toHaveProperty('status')
      expect(response.status).toBe(200)
      expect(response.headers.height).toBe(1)
    })

    it('should fail when sending 2 transactions double spending', async () => {
      const amount = 245098000000000 - 5098000000000 // a bit less than the delegates' balance
      const transactions = generateTransfers('testnet', delegates[0].secret, delegates[1].address, amount, 2, true)

      const response = await utils.POST('peer/transactions', {
        transactions
      })

      expect(response).toHaveProperty('status')
      expect(response.status).toBe(406)

      expect(response.result.error).toBeObject()
      expect(response.result.error[transactions[1].id]).toEqual([ `Error: [PoolWalletManager] Can't apply transaction ${transactions[1].id}` ])
    })

    it.each([3, 5, 8])('should accept %i transactions emptying a wallet', async (txNumber) => {
      const sender = delegates[txNumber] // use txNumber so that we use a different delegate for each test case
      const receivers = generateWallets('testnet', 2)
      const amountPlusFee = Math.floor(sender.balance / txNumber)
      const lastAmountPlusFee = sender.balance - (txNumber - 1) * amountPlusFee

      const transactions = generateTransfers('testnet', sender.secret, receivers[0].address, amountPlusFee - transferFee, txNumber - 1, true)
      const lastTransaction = generateTransfers('testnet', sender.secret, receivers[1].address, lastAmountPlusFee - transferFee, 1, true)
      // we change the receiver in lastTransaction to prevent having 2 exact same transactions with same id (if not, could be same as transactions[0])

      const allTransactions = transactions.concat(lastTransaction)

      const response = await utils.POST('peer/transactions', {
        transactions: allTransactions
      })

      expect(response).toHaveProperty('status')
      expect(response.status).toBe(200)
    })

    it.each([3, 5, 8])('should not accept the last of %i transactions emptying a wallet when the last one is 1 arktoshi too much', async (txNumber) => {
      const sender = delegates[txNumber + 1] // use txNumber + 1 so that we don't use the same delegates as the above test
      const receivers = generateWallets('testnet', 2)
      const amountPlusFee = Math.floor(sender.balance / txNumber)
      const lastAmountPlusFee = sender.balance - (txNumber - 1) * amountPlusFee + 1

      const transactions = generateTransfers('testnet', sender.secret, receivers[0].address, amountPlusFee - transferFee, txNumber - 1, true)
      const lastTransaction = generateTransfers('testnet', sender.secret, receivers[1].address, lastAmountPlusFee - transferFee, 1, true)
      // we change the receiver in lastTransaction to prevent having 2 exact same transactions with same id (if not, could be same as transactions[0])

      const allTransactions = transactions.concat(lastTransaction)

      const response = await utils.POST('peer/transactions', {
        transactions: allTransactions
      })

      expect(response).toHaveProperty('status')
      expect(response.status).toBe(406)

      expect(response.result.error).toBeObject()
      expect(response.result.error[lastTransaction[0].id]).toEqual([ `Error: [PoolWalletManager] Can't apply transaction ${lastTransaction[0].id}` ])
    })
  })

  describe('POST /peer/blocks', () => {
    it('should fail with status code 202 when posting existing block', async () => {
      const response = await utils.POST('peer/blocks', {
        block: genesisBlock.toJson()
      })

      expect(response).toHaveProperty('status')
      expect(response.status).toBe(202)
      expect(response.headers.height).toBe(1)
    })

    it('should create block with status code 201 when posting valid block', async () => {
      const block2 = blocks2to100[0]
      const response = await utils.POST('peer/blocks', {
        block: block2
      })

      expect(response).toHaveProperty('status')
      expect(response.status).toBe(201)
      expect(response.headers.height).toBe(1)
    })
  })
})
