'use strict'

const toBeMinimalTransactionFields = require('../__support__/matchers/minimal-transaction-fields')
expect.extend({ toBeMinimalTransactionFields })

const { crypto, models } = require('@arkecosystem/crypto')
const { Transaction } = models
const SPV = require('../../lib/spv')

const app = require('../__support__/setup')
const createConnection = require('../__support__/utils/create-connection')

let genesisBlock
let genesisTransaction
let connection
let repository
let spv

const getWallet = address => {
  return spv.walletManager.findByAddress(address)
}

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('../__fixtures__/genesisBlock')
  genesisTransaction = genesisBlock.transactions[0]
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(async () => {
  connection = await createConnection()
  repository = connection.transactions
  spv = new SPV(connection)

  // To avoid timing out
  const cache = {}
  repository.cache.get = jest.fn(key => cache[key])
  repository.cache.set = jest.fn((key, value) => (cache[key] = value))
})

afterEach(async () => {
  connection.disconnect()
})

describe('Transaction Repository', () => {
  it('should be an object', () => {
    expect(repository).toBeObject()
  })

  describe('findAll', () => {
    it('should be a function', () => {
      expect(repository.findAll).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAll()

      // NOTE: The real count is avoided because it degrades the performance of the node
      // expect(transactions.count).toBe(153)
      expect(transactions.count).toBe(100)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    it('should find all transactions that holds the condition', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAll({
        type: 3
      })

      expect(transactions.count).toBe(51)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    it('should find all transactions that holds all the conditions (AND)', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAll({
        recipientId: genesisTransaction.recipientId,
        type: 3
      })

      expect(transactions.count).toBe(1)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    it('should find the same transactions with parameter senderId and corresponding senderPublicKey', async () => {
      await connection.saveBlock(genesisBlock)
      const senderWallet = await spv.walletManager.findByPublicKey('034776bd6080a504b0f84f8d66b16af292dc253aa5f4be8b807746a82aa383bd3c')

      const transactionsSenderPublicKey = await repository.findAll({ senderPublicKey: senderWallet.publicKey })
      const transactionsSenderId = await repository.findAll({ senderId: senderWallet.address })

      expect(transactionsSenderPublicKey.count).toBe(transactionsSenderId.count)
      expect(transactionsSenderPublicKey.rows.length).toBe(transactionsSenderPublicKey.count)
      expect(transactionsSenderId.rows.length).toBe(transactionsSenderId.count)

      transactionsSenderPublicKey.rows.forEach((transactionSenderPublicKey, index) => {
        const transactionSenderId = transactionsSenderId.rows[index]
        expect(transactionSenderId).toEqual(transactionSenderPublicKey)
      })
    })

    it('should find no transaction when passed parameter senderId is invalid or unknown', async () => {
      await connection.saveBlock(genesisBlock)
      const invalidSenderId = 'thisIsNotAValidSenderId'

      const transactionsSenderId = await repository.findAll({ senderId: invalidSenderId })

      expect(transactionsSenderId.count).toBe(0)
      expect(transactionsSenderId.rows.length).toBe(0)
    })

    xit('should find all transactions by some fields only', () => {
    })

    describe('when no results', () => {
      it('should not return them', async () => {
        await connection.saveBlock(genesisBlock)

        const transactions = await repository.findAll({ type: 99 })

        expect(transactions.count).toBe(0)
        expect(transactions.rows).toBeArray()
        expect(transactions.rows).toBeEmpty()
      })

      // TODO this and other methods
      xit('should not perform a query to get the results', () => {
      })
    })
  })

  describe('findAllLegacy', () => {
    it('should be a function', () => {
      expect(repository.findAllLegacy).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllLegacy()

      // NOTE: The real count is avoided because it degrades the performance of the node
      // expect(transactions.count).toBe(153)
      expect(transactions.count).toBe(100)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    it('should find all transactions that holds the condition', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllLegacy({
        type: 3
      })

      expect(transactions.count).toBe(51)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    it('should find all transactions that holds any of the conditions (OR)', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllLegacy({
        recipientId: genesisTransaction.recipientId,
        type: 3
      })

      expect(transactions.count).toBe(52)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    it('should find the same transactions with parameter senderId and corresponding senderPublicKey', async () => {
      await connection.saveBlock(genesisBlock)
      const senderWallet = await spv.walletManager.findByPublicKey('034776bd6080a504b0f84f8d66b16af292dc253aa5f4be8b807746a82aa383bd3c')

      const transactionsSenderPublicKey = await repository.findAllLegacy({ senderPublicKey: senderWallet.publicKey })
      const transactionsSenderId = await repository.findAllLegacy({ senderId: senderWallet.address })

      expect(transactionsSenderPublicKey.count).toBe(transactionsSenderId.count)
      expect(transactionsSenderPublicKey.rows.length).toBe(transactionsSenderPublicKey.count)
      expect(transactionsSenderId.rows.length).toBe(transactionsSenderId.count)

      transactionsSenderPublicKey.rows.forEach((transactionSenderPublicKey, index) => {
        const transactionSenderId = transactionsSenderId.rows[index]
        expect(transactionSenderId).toEqual(transactionSenderPublicKey)
      })
    })

    it('should find no transaction when passed parameter senderId is invalid or unknown', async () => {
      await connection.saveBlock(genesisBlock)
      const invalidSenderId = 'thisIsNotAValidSenderId'

      const transactionsSenderId = await repository.findAllLegacy({ senderId: invalidSenderId })

      expect(transactionsSenderId.count).toBe(0)
      expect(transactionsSenderId.rows.length).toBe(0)
    })

    xit('should find all transactions by any field', () => {
    })

    describe('when no results', () => {
      it('should not return them', async () => {
        await connection.saveBlock(genesisBlock)

        const transactions = await repository.findAllLegacy({ type: 99 })

        expect(transactions.count).toBe(0)
        expect(transactions.rows).toBeArray()
        expect(transactions.rows).toBeEmpty()
      })

      xit('should not perform a query to get the results', () => {
      })
    })
  })

  describe('findAllByWallet', () => {
    it('should be a function', () => {
      expect(repository.findAllByWallet).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const receiver = await getWallet('AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri')
      expect(receiver).toBeObject()

      const receiverTransactions = await repository.findAllByWallet(receiver)

      expect(receiverTransactions.count).toBe(2)
      expect(receiverTransactions.rows).toBeArray()
      expect(receiverTransactions.rows).not.toBeEmpty()
      receiverTransactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })

      const sender = await getWallet('APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn')
      expect(sender).toBeObject()
      sender.publicKey = '035b63b4668ee261c16ca91443f3371e2fe349e131cb7bf5f8a3e93a3ddfdfc788'

      const senderTransactions = await repository.findAllByWallet(sender)

      expect(senderTransactions.count).toBe(51)
      expect(receiverTransactions.rows).toBeArray()
      expect(receiverTransactions.rows).not.toBeEmpty()
      senderTransactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    describe('when no results', () => {
      it('should not return them', async () => {
        await connection.saveBlock(genesisBlock)

        const transactions = await repository.findAll({ type: 99 })

        expect(transactions.count).toBe(0)
        expect(transactions.rows).toBeArray()
        expect(transactions.rows).toBeEmpty()
      })
    })
  })

  describe('findAllBySender', () => {
    it('should be a function', () => {
      expect(repository.findAllBySender).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllBySender('03ba0fa7dd4760a15e46bc762ac39fc8cfb7022bdfef31d1fd73428404796c23fe')

      expect(transactions.count).toBe(2)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    describe('when no results', () => {
      it('should not return them', async () => {
        await connection.saveBlock(genesisBlock)

        const transactions = await repository.findAll({ type: 99 })

        expect(transactions.count).toBe(0)
        expect(transactions.rows).toBeArray()
        expect(transactions.rows).toBeEmpty()
      })
    })
  })

  describe('findAllByRecipient', () => {
    it('should be a function', () => {
      expect(repository.findAllByRecipient).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllByRecipient('AU8hpb5QKJXBx6QhAzy3CJJR69pPfdvp5t')

      expect(transactions.count).toBe(2)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    describe('when no results', () => {
      it('should not return them', async () => {
        await connection.saveBlock(genesisBlock)

        const transactions = await repository.findAllByRecipient('none')

        expect(transactions.count).toBe(0)
        expect(transactions.rows).toBeArray()
        expect(transactions.rows).toBeEmpty()
      })
    })
  })

  describe('allVotesBySender', () => {
    it('should be a function', () => {
      expect(repository.allVotesBySender).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.allVotesBySender('03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357')

      expect(transactions.count).toBe(1)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    describe('when no results', () => {
      it('should not return them', async () => {
        await connection.saveBlock(genesisBlock)

        const transactions = await repository.allVotesBySender('none')

        expect(transactions.count).toBe(0)
        expect(transactions.rows).toBeArray()
        expect(transactions.rows).toBeEmpty()
      })
    })
  })

  describe('findAllByBlock', () => {
    it('should be a function', () => {
      expect(repository.findAllByBlock).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllByBlock(genesisBlock.data.id)

      // NOTE: The real count is avoided because it degrades the performance of the node
      // expect(transactions.count).toBe(153)
      expect(transactions.count).toBe(100)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    describe('when no results', () => {
      it('should not return them', async () => {
        await connection.saveBlock(genesisBlock)

        const transactions = await repository.findAllByBlock('none')

        expect(transactions.count).toBe(0)
        expect(transactions.rows).toBeArray()
        expect(transactions.rows).toBeEmpty()
      })
    })
  })

  describe('findAllByType', () => {
    it('should be a function', () => {
      expect(repository.findAllByType).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllByType(2)

      expect(transactions.count).toBe(51)
      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
      })
    })

    describe('when no results', () => {
      it('should not return them', async () => {
        await connection.saveBlock(genesisBlock)

        const transactions = await repository.findAllByType(88)
        expect(transactions.rows).toBeArray()
        expect(transactions.rows).toBeEmpty()
        expect(transactions.count).toBe(0)
      })
    })
  })

  describe('findOne', () => {
    it('should be a function', () => {
      expect(repository.findOne).toBeFunction()
    })

    it('should find the transaction fields', async () => {
      await connection.saveBlock(genesisBlock)

      const recipientId = 'AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri'
      const senderPublicKey = '035b63b4668ee261c16ca91443f3371e2fe349e131cb7bf5f8a3e93a3ddfdfc788'

      const fields = await repository.findOne({ recipientId, senderPublicKey })
      expect(fields).toBeMinimalTransactionFields()

      const transaction = Transaction.deserialize(fields.serialized.toString('hex'))
      expect(transaction.id).toBe('db1aa687737858cc9199bfa336f9b1c035915c30aaee60b1e0f8afadfdb946bd')
      expect(transaction.recipientId).toBe(recipientId)
      expect(transaction.senderPublicKey).toBe(senderPublicKey)
    })

    describe('when the block is cached', () => {
      xit('uses it without executing additional queries', () => {
      })
    })
  })

  describe('findById', () => {
    it('should be a function', () => {
      expect(repository.findById).toBeFunction()
    })

    it('should find the transaction fields', async () => {
      await connection.saveBlock(genesisBlock)

      const fields = await repository.findById(genesisTransaction.id)
      expect(fields).toBeMinimalTransactionFields()

      const transaction = Transaction.deserialize(fields.serialized.toString('hex'))
      expect(transaction.id).toBe(genesisTransaction.id)
    })
  })

  describe('findByTypeAndId', () => {
    it('should be a function', () => {
      expect(repository.findByTypeAndId).toBeFunction()
    })

    it('should find the transaction fields', async () => {
      await connection.saveBlock(genesisBlock)

      const id = 'ea294b610e51efb3ceb4229f27bf773e87f41d21b6bb1f3bf68629ffd652c2d3'
      const type = 3

      const fields = await repository.findByTypeAndId(type, id)
      expect(fields).toBeMinimalTransactionFields()

      const transaction = Transaction.deserialize(fields.serialized.toString('hex'))
      expect(transaction.id).toBe(id)
      expect(transaction.type).toBe(type)
    })
  })

  describe('search', async () => {
    const expectSearch = async (params, expected) => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.search(params)
      expect(transactions).toBeObject()

      expect(transactions.count).toBeNumber()

      expect(transactions.rows).toBeArray()
      expect(transactions.rows).not.toBeEmpty()
      transactions.rows.forEach(transaction => {
        expect(transaction).toBeMinimalTransactionFields()
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

    // TODO when is not on the blockchain?
    // TODO when is not indexed?
    describe('when the wallet is indexed', () => {
      const senderId = () => {
        return crypto.getAddress(genesisTransaction.senderPublicKey, 23)
      }

      beforeEach(() => {
        const wallet = getWallet(senderId())
        wallet.publicKey = genesisTransaction.senderPublicKey
        spv.walletManager.reindex(wallet)
      })

      it('should search transactions by the specified `senderId`', async () => {
        await expectSearch({ senderId: senderId() }, 51)
      })
    })

    it('should search transactions by the specified `senderPublicKey`', async () => {
      await expectSearch({ senderPublicKey: genesisTransaction.senderPublicKey }, 51)
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
        await connection.saveBlock(genesisBlock)

        const transactions = await repository.search({ recipientId: 'dummy' })
        expect(transactions).toBeObject()

        expect(transactions).toHaveProperty('count', 0)

        expect(transactions.rows).toBeArray()
        expect(transactions.rows).toBeEmpty()
      })
    })
  })

  describe('count', () => {
    it('should return the total number of transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const { count } = await repository.count()
      expect(count).toBe(153)
    })
  })
})
