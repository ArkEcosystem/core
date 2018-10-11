'use strict'

const generateTransfers = require('@arkecosystem/core-test-utils/lib/generators/transactions/transfer')
const delegates = require('@arkecosystem/core-test-utils/fixtures/testnet/delegates')
const app = require('./__support__/setup')
const defaultConfig = require('../lib/defaults')

let TransactionGuard
let connection
let guard

beforeAll(async () => {
  await app.setUp()

  TransactionGuard = require('@arkecosystem/core-transaction-pool/lib/guard')

  const RedisConnection = require('../lib/connection.js')
  connection = new RedisConnection(defaultConfig)
  connection = await connection.make()
  guard = new TransactionGuard(connection)
})

afterAll(async () => {
  await connection.disconnect()
  await app.tearDown()
})

beforeEach(async () => {
  await connection.flush()
})

afterEach(async () => {
  await connection.flush()
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

      expect(guard.errors[transactions[1].id]).toEqual([`Error: PoolWalletManager: Can't apply transaction ${transactions[1].id}`])
    })
  })
})
