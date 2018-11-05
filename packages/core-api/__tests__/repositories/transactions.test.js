'use strict'

require('@arkecosystem/core-test-utils/lib/matchers')
const app = require('../__support__/setup')
const { crypto } = require('@arkecosystem/crypto')

let genesisBlock
let genesisTransaction
let repository

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('@arkecosystem/core-test-utils/config/testnet/genesisBlock.json')
  genesisTransaction = genesisBlock.transactions[0]
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(async () => {
  repository = require('../../lib/repositories/transactions')
})

describe('Transaction Repository', () => {
  describe('search', async () => {
    const expectSearch = async (params, expected) => {
      // await connection.saveBlock(genesisBlock)

      const transactions = await repository.search(params)
      expect(transactions).toBeObject()

      expect(transactions.count).toBeNumber()

      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toContainKeys([
          'id', 'version', 'sequence', 'timestamp', 'type', 'amount', 'fee', 'serialized',
          'blockId', 'senderPublicKey', 'vendorFieldHex', 'block'
        ])
      })

      expect(transactions.count).toBe(expected)
    }

    it('should be a function', () => {
      expect(repository.search).toBeFunction()
    })

    it('should search transactions by the specified `id`', async () => {
      await expectSearch({ id: genesisTransaction.id }, 1)
    })

    it('should search transactions by the specified `blockId`', async () => {
      await expectSearch({ blockId: genesisTransaction.blockId }, 153)
    })

    it('should search transactions by the specified `type`', async () => {
      await expectSearch({ type: genesisTransaction.type }, 51)
    })

    it('should search transactions by the specified `version`', async () => {
      await expectSearch({ version: genesisTransaction.version }, 153)
    })

    it('should search transactions by the specified `senderPublicKey`', async () => {
      await expectSearch({ senderPublicKey: genesisTransaction.senderPublicKey }, 51)
    })

    it('should search transactions by the specified `senderId`', async () => {
      const senderId = crypto.getAddress(genesisTransaction.senderPublicKey, 23)
      await expectSearch({ senderId }, 51)
    })

    it('should search transactions by the specified `recipientId`', async () => {
      await expectSearch({ recipientId: genesisTransaction.recipientId }, 2)
    })

    it('should search transactions by the specified `timestamp`', async () => {
      await expectSearch({
        timestamp: {
          from: genesisTransaction.timestamp,
          to: genesisTransaction.timestamp
        }
      }, 153)
    })

    it('should search transactions by the specified `amount`', async () => {
      await expectSearch({
        amount: {
          from: genesisTransaction.amount,
          to: genesisTransaction.amount
        }
      }, 50)
    })

    it('should search transactions by the specified `fee`', async () => {
      await expectSearch({
        fee: {
          from: genesisTransaction.fee,
          to: genesisTransaction.fee
        }
      }, 153)
    })

    it('should search transactions by the specified `vendorFieldHex`', async () => {
      await expectSearch({ vendorFieldHex: genesisTransaction.vendorFieldHex }, 153)
    })

    describe('when there are more than 1 condition', () => {
      it('should search transactions that includes all of them (AND)', async () => {
        await expectSearch({ recipientId: genesisTransaction.recipientId, type: 3 }, 1)
      })
    })

    describe('when no results', () => {
      it('should not return them', async () => {
        // await connection.saveBlock(genesisBlock)

        const transactions = await repository.search({ recipientId: 'dummy' })
        expect(transactions).toBeObject()

        expect(transactions).toHaveProperty('count', 0)

        expect(transactions.rows).toBeArray()
        expect(transactions.rows).toBeEmpty()
      })
    })
  })
})
