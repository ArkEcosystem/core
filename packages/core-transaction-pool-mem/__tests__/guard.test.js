'use strict'

const generateTransfers = require('@arkecosystem/core-test-utils/lib/generators/transactions/transfer')
const generateWallets = require('@arkecosystem/core-test-utils/lib/generators/wallets')
const delegates = require('@arkecosystem/core-test-utils/fixtures/testnet/delegates')
const app = require('./__support__/setup')
const defaultConfig = require('../lib/defaults')
const transferFee = 10000000

let TransactionGuard
let transactionPool
let guard

beforeAll(async () => {
  await app.setUp()

  TransactionGuard = require('@arkecosystem/core-transaction-pool/lib/guard')

  const TransactionPool = require('../lib/connection.js')
  transactionPool = new TransactionPool(defaultConfig)
  transactionPool = await transactionPool.make()
  guard = new TransactionGuard(transactionPool)
})

afterAll(async () => {
  await transactionPool.disconnect()
  await app.tearDown()
})

beforeEach(async () => {
  await transactionPool.flush()
})

afterEach(async () => {
  await transactionPool.flush()
})

describe('Transaction Guard', () => {
  it('should be an object', () => {
    expect(guard).toBeObject()
  })

  describe('validate', () => {
    it('should be a function', () => {
      expect(guard.validate).toBeFunction()
    })

    it('should not validate 2 double spending transactions', async () => {
      const amount = 245098000000000 - 5098000000000 // a bit less than the delegates' balance
      const transactions = generateTransfers('testnet', delegates[0].secret, delegates[1].address, amount, 2, true)

      await guard.validate(transactions)

      expect(guard.errors[transactions[1].id]).toEqual([`Error: [PoolWalletManager] Can't apply transaction ${transactions[1].id}`])
    })

    it.each([3, 5, 8])('should validate emptying wallet with %i transactions', async (txNumber) => {
      guard.__reset()

      const sender = delegates[txNumber] // use txNumber so that we use a different delegate for each test case
      const receivers = generateWallets('testnet', 2)
      const amountPlusFee = Math.floor(sender.balance / txNumber)
      const lastAmountPlusFee = sender.balance - (txNumber - 1) * amountPlusFee

      const transactions = generateTransfers('testnet', sender.secret, receivers[0].address, amountPlusFee - transferFee, txNumber - 1, true)
      const lastTransaction = generateTransfers('testnet', sender.secret, receivers[1].address, lastAmountPlusFee - transferFee, 1, true)
      // we change the receiver in lastTransaction to prevent having 2 exact same transactions with same id (if not, could be same as transactions[0])

      await guard.validate(transactions.concat(lastTransaction))

      expect(guard.errors).toEqual({})
    })

    it.each([3, 5, 8])('should not validate emptying wallet with %i transactions when the last one is 1 arktoshi too much', async (txNumber) => {
      guard.__reset()

      const sender = delegates[txNumber + 1] // use txNumber + 1 so that we don't use the same delegates as the above test
      const receivers = generateWallets('testnet', 2)
      const amountPlusFee = Math.floor(sender.balance / txNumber)
      const lastAmountPlusFee = sender.balance - (txNumber - 1) * amountPlusFee + 1

      const transactions = generateTransfers('testnet', sender.secret, receivers[0].address, amountPlusFee - transferFee, txNumber - 1, true)
      const lastTransaction = generateTransfers('testnet', sender.secret, receivers[1].address, lastAmountPlusFee - transferFee, 1, true)
      // we change the receiver in lastTransaction to prevent having 2 exact same transactions with same id (if not, could be same as transactions[0])

      const allTransactions = transactions.concat(lastTransaction)

      await guard.validate(allTransactions)

      expect(guard.errors[allTransactions[txNumber - 1].id]).toEqual([`Error: [PoolWalletManager] Can't apply transaction ${allTransactions[txNumber - 1].id}`])
    })
  })
})
