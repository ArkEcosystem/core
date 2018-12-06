/* eslint max-len: "off" */

require('@arkecosystem/core-test-utils/lib/matchers')
const generateTransfers = require('@arkecosystem/core-test-utils/lib/generators/transactions/transfer')
const generateWallets = require('@arkecosystem/core-test-utils/lib/generators/wallets')
const delegates = require('@arkecosystem/core-test-utils/fixtures/testnet/delegates')
const app = require('../../__support__/setup')
const utils = require('../utils')

const transferFee = 10000000

let genesisBlock
let genesisTransactions

let transactionId
let blockId
let type
let wrongType
let version
let senderPublicKey
let senderAddress
let recipientAddress
let timestamp
let timestampFrom
let timestampTo
let amount
let amountFrom
let amountTo
let fee
let feeFrom
let feeTo

beforeAll(async () => {
  await app.setUp()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = require('@arkecosystem/core-test-utils/config/testnet/genesisBlock.json')
  genesisTransactions = genesisBlock.transactions[0]

  transactionId = genesisTransactions.id
  blockId = genesisBlock.id
  type = genesisTransactions.type
  wrongType = 3
  version = 1
  senderPublicKey = genesisTransactions.senderPublicKey
  senderAddress = genesisTransactions.senderId
  recipientAddress = genesisTransactions.recipientId
  timestamp = genesisTransactions.timestamp
  timestampFrom = timestamp
  timestampTo = timestamp
  amount = genesisTransactions.amount
  amountFrom = amount
  amountTo = amount
  fee = genesisTransactions.fee
  feeFrom = fee
  feeTo = fee
})

afterAll(async () => {
  await app.tearDown()
})

describe('API 2.0 - Transactions', () => {
  describe('GET /transactions', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET all the transactions', async () => {
        const response = await utils[request]('GET', 'transactions')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        utils.expectTransaction(response.data.data[0])
      })
    })
  })

  describe('GET /transactions/:id', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET a transaction by the given identifier', async () => {
        const response = await utils[request](
          'GET',
          `transactions/${transactionId}`,
        )
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        const transaction = response.data.data
        utils.expectTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
      })
    })
  })

  describe('GET /transactions/unconfirmed', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET all the unconfirmed transactions', async () => {
        await utils.createTransaction()

        const response = await utils[request]('GET', 'transactions/unconfirmed')
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toBeArray()
        expect(response.data.data).not.toBeEmpty()
      })
    })
  })

  describe('GET /transactions/unconfirmed/:id', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should GET an unconfirmed transaction by the given identifier', async () => {
        const transaction = await utils.createTransaction()

        const response = await utils[request](
          'GET',
          `transactions/unconfirmed/${transaction.id}`,
        )
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeObject()

        expect(response.data.data).toHaveProperty('id', transaction.id)
      })
    })
  })

  describe('POST /transactions/search', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified transactionId', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          id: transactionId,
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(1)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.id).toBe(transactionId)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified blockId', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          blockId,
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()

        expect(response.data.data).toHaveLength(100)
        expect(response.data.meta.totalCount).toBe(153)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.blockId).toBe(blockId)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified type', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          type,
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()
        expect(response.data.data).toHaveLength(51)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.type).toBe(type)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified version', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          version,
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()
        expect(response.data.data).toHaveLength(100)
        expect(response.data.meta.totalCount).toBe(153)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.version).toBe(version)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified senderPublicKey', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          senderPublicKey,
        })

        expect(response).toBeSuccessfulResponse()

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.sender).toBe(senderAddress)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified senderId', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          senderId: senderAddress,
        })

        expect(response).toBeSuccessfulResponse()

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.sender).toBe(senderAddress)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified recipientId (Address)', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          recipientId: recipientAddress,
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()
        expect(response.data.data).toHaveLength(2)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.recipient).toBe(recipientAddress)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified timestamp', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          timestamp: {
            from: timestamp,
            to: timestamp,
          },
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data.length).toEqual(100)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.timestamp.epoch).toBe(timestamp)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the specified timestamp range', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          timestamp: {
            from: timestampFrom,
            to: timestampTo,
          },
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data).toHaveLength(100)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.timestamp.epoch).toBeGreaterThanOrEqual(
            timestampFrom,
          )
          expect(transaction.timestamp.epoch).toBeLessThanOrEqual(timestampTo)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified amount', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          amount: {
            from: amount,
            to: amount,
          },
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data).toHaveLength(50)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.amount).toBe(amount)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the specified amount range', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          amount: {
            from: amountFrom,
            to: amountTo,
          },
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data).toHaveLength(50)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.amount).toBeGreaterThanOrEqual(amountFrom)
          expect(transaction.amount).toBeLessThanOrEqual(amountTo)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the exact specified fee', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          fee: {
            from: fee,
            to: fee,
          },
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data).toHaveLength(100)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.fee).toBe(fee)
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the specified fee range', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          fee: {
            from: feeFrom,
            to: feeTo,
          },
        })

        expect(response).toBeSuccessfulResponse()

        const data = response.data.data
        expect(data).toBeArray()
        expect(data).toHaveLength(100)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.fee).toBeGreaterThanOrEqual(feeFrom)
          expect(transaction.fee).toBeLessThanOrEqual(feeTo)
        }
      })
    })

    // TODO remove the search by id, to be sure that is OK
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it.skip('should POST a search for transactions with the exact specified vendorFieldHex', async () => {
        const id =
          '0000faa27b422f7648b1a2f634f15c7e5c8e96b84929624fda44abf716bdf784'
        const vendorFieldHex =
          '64656c65676174653a20766f746572732073686172652e205468616e6b20796f7521207c74782062792061726b2d676f'

        const response = await utils[request]('POST', 'transactions/search', {
          id,
          vendorFieldHex,
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()
        expect(response.data.data).toHaveLength(1)

        for (const transaction of response.data.data) {
          utils.expectTransaction(transaction)
          expect(transaction.vendorField).toBe(vendorFieldHex.toString('utf8'))
        }
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the wrong specified type', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          id: transactionId,
          type: wrongType,
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()
        expect(response.data.data).toHaveLength(0)
      })
    })

    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      it('should POST a search for transactions with the specific criteria', async () => {
        const response = await utils[request]('POST', 'transactions/search', {
          senderPublicKey,
          type,
          timestamp: {
            from: timestampFrom,
            to: timestampTo,
          },
        })
        expect(response).toBeSuccessfulResponse()
        expect(response.data.data).toBeArray()
        utils.expectTransaction(response.data.data[0])
      })
    })
  })

  describe('POST /transactions', () => {
    describe.each([
      ['API-Version', 'request'],
      ['Accept', 'requestWithAcceptHeader'],
    ])('using the %s header', (header, request) => {
      const transactions = generateTransfers(
        'testnet',
        delegates[0].secret,
        delegates[1].address,
        1,
        40,
        true,
      )

      it('should POST all the transactions', async () => {
        const response = await utils[request]('POST', 'transactions', {
          transactions,
        })
        expect(response).toBeSuccessfulResponse()
      })

      it('should not POST all the transactions', async () => {
        const response = await utils[request]('POST', 'transactions', {
          transactions: transactions.concat(transactions),
        })

        expect(response.data.statusCode).toBe(413)
        expect(response.data.message).toBe(
          'Received 80 transactions. Only 40 are allowed per request.',
        )
      })
    })

    it('should POST 2 transactions double spending and get only 1 accepted and broadcasted', async () => {
      const transactions = generateTransfers(
        'testnet',
        delegates[0].secret,
        delegates[1].address,
        245098000000000 - 5098000000000, // a bit less than the delegates' balance
        2,
        true,
      )
      const response = await utils.requestWithAcceptHeader(
        'POST',
        'transactions',
        {
          transactions,
        },
      )

      expect(response).toBeSuccessfulResponse()
      expect(response.data.data).toBeObject()

      expect(response.data.data.accept.length).toBe(1)
      expect(response.data.data.accept[0]).toBe(transactions[0].id)

      expect(response.data.data.broadcast.length).toBe(1)
      expect(response.data.data.broadcast[0]).toBe(transactions[0].id)

      expect(response.data.data.invalid.length).toBe(1)
      expect(response.data.data.invalid[0]).toBe(transactions[1].id)
    })

    it.each([3, 5, 8])(
      'should accept and broadcast %i transactions emptying a wallet',
      async txNumber => {
        const sender = delegates[txNumber] // use txNumber so that we use a different delegate for each test case
        const receivers = generateWallets('testnet', 2)
        const amountPlusFee = Math.floor(sender.balance / txNumber)
        const lastAmountPlusFee =
          sender.balance - (txNumber - 1) * amountPlusFee

        const transactions = generateTransfers(
          'testnet',
          sender.secret,
          receivers[0].address,
          amountPlusFee - transferFee,
          txNumber - 1,
          true,
        )
        const lastTransaction = generateTransfers(
          'testnet',
          sender.secret,
          receivers[1].address,
          lastAmountPlusFee - transferFee,
          1,
          true,
        )
        // we change the receiver in lastTransaction to prevent having 2 exact same transactions with same id (if not, could be same as transactions[0])

        const allTransactions = transactions.concat(lastTransaction)

        const response = await utils.requestWithAcceptHeader(
          'POST',
          'transactions',
          {
            transactions: allTransactions,
          },
        )

        expect(response).toBeSuccessfulResponse()

        expect(response.data.data.accept.sort()).toEqual(
          allTransactions.map(transaction => transaction.id).sort(),
        )
        expect(response.data.data.broadcast.sort()).toEqual(
          allTransactions.map(transaction => transaction.id).sort(),
        )
        expect(response.data.data.invalid.length).toBe(0)
      },
    )

    it.each([3, 5, 8])(
      'should not accept the last of %i transactions emptying a wallet when the last one is 1 arktoshi too much',
      async txNumber => {
        const sender = delegates[txNumber + 1] // use txNumber + 1 so that we don't use the same delegates as the above test
        const receivers = generateWallets('testnet', 2)
        const amountPlusFee = Math.floor(sender.balance / txNumber)
        const lastAmountPlusFee =
          sender.balance - (txNumber - 1) * amountPlusFee + 1

        const transactions = generateTransfers(
          'testnet',
          sender.secret,
          receivers[0].address,
          amountPlusFee - transferFee,
          txNumber - 1,
          true,
        )
        const lastTransaction = generateTransfers(
          'testnet',
          sender.secret,
          receivers[1].address,
          lastAmountPlusFee - transferFee,
          1,
          true,
        )
        // we change the receiver in lastTransaction to prevent having 2 exact same transactions with same id (if not, could be same as transactions[0])

        const allTransactions = transactions.concat(lastTransaction)

        const response = await utils.requestWithAcceptHeader(
          'POST',
          'transactions',
          {
            transactions: allTransactions,
          },
        )

        expect(response).toBeSuccessfulResponse()

        expect(response.data.data.accept.sort()).toEqual(
          transactions.map(transaction => transaction.id).sort(),
        )
        expect(response.data.data.broadcast.sort()).toEqual(
          transactions.map(transaction => transaction.id).sort(),
        )
        expect(response.data.data.invalid).toEqual(
          lastTransaction.map(transaction => transaction.id),
        )
      },
    )
  })
})
