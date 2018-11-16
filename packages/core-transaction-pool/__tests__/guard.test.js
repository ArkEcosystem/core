/* eslint import/no-extraneous-dependencies: "off" */
/* eslint no-await-in-loop: "off" */
const Guard = require('@arkecosystem/core-transaction-pool/lib/guard')
const generateTransfers = require('@arkecosystem/core-test-utils/lib/generators/transactions/transfer')
const generateWallets = require('@arkecosystem/core-test-utils/lib/generators/wallets')
const delegates = require('@arkecosystem/core-test-utils/fixtures/testnet/delegates')
const slots = require('@arkecosystem/crypto').slots
const app = require('./__support__/setup')

let guard
let transactionPool

beforeAll(async () => {
  await app.setUp()

  transactionPool = require('@arkecosystem/core-container').resolvePlugin('transactionPool')
  transactionPool.make()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  transactionPool.flush()
  guard = new Guard(transactionPool)
})

describe('Transaction Guard', () => {
  it('should be an object', () => {
    expect(guard).toBeObject()
  })

  describe('validate', () => {
    const transferFee = 10000000

    it('should be a function', () => {
      expect(guard.validate).toBeFunction()
    })

    it('should not validate 2 double spending transactions', async () => {
      const amount = 245098000000000 - 5098000000000 // a bit less than the delegates' balance
      const transactions = generateTransfers(
        'testnet',
        delegates[0].secret,
        delegates[1].address,
        amount,
        2,
        true,
      )

      const result = await guard.validate(transactions)

      expect(result.errors[transactions[1].id]).toEqual([
        {
          message: `Error: [PoolWalletManager] Can't apply transaction ${
            transactions[1].id
          }`,
          type: 'ERR_UNKNOWN',
        },
      ])
    })

    it.each([3, 5, 8])(
      'should validate emptying wallet with %i transactions',
      async txNumber => {
        // use txNumber so that we use a different delegate for each test case
        const sender = delegates[txNumber]
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
        // we change the receiver in lastTransaction to prevent having 2 exact
        // same transactions with same id (if not, could be same as transactions[0])

        const result = await guard.validate(transactions.concat(lastTransaction))

        expect(result.errors).toEqual(null)
      },
    )

    it.each([3, 5, 8])(
      'should not validate emptying wallet with %i transactions when the last one is 1 arktoshi too much',
      async txNumber => {
        // use txNumber + 1 so that we don't use the same delegates as the above test
        const sender = delegates[txNumber + 1]
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
        // we change the receiver in lastTransaction to prevent having 2
        // exact same transactions with same id (if not, could be same as transactions[0])

        const allTransactions = transactions.concat(lastTransaction)

        const result = await guard.validate(allTransactions)

        expect(result.errors[allTransactions[txNumber - 1].id]).toEqual([
          {
            message: `Error: [PoolWalletManager] Can't apply transaction ${
              allTransactions[txNumber - 1].id
            }`,
            type: 'ERR_UNKNOWN',
          },
        ])
      },
    )

    it('should call pingTransaction', async () => {
      const amount = 10000000 // a bit less than the delegates' balance
      const transactions = generateTransfers(
        'testnet',
        delegates[0].secret,
        delegates[1].address,
        amount,
        1,
        true,
      )

      const pingTransaction = transactionPool.pingTransaction
      transactionPool.pingTransaction = jest.fn()

      let result = await guard.validate(transactions)
      transactionPool.addTransactions(result.accept)
      expect(result.broadcast).toHaveLength(1)

      guard = new Guard(transactionPool)
      result = await guard.validate(transactions)

      expect(result.broadcast).toBeEmpty()
      expect(transactionPool.pingTransaction).toHaveBeenCalled()
      expect(transactionPool.pingTransaction).toHaveBeenCalledTimes(1)

      transactionPool.pingTransaction = pingTransaction
      for (let i = 0; i < 10; i++) {
        await guard.validate(transactions)
      }
      expect(transactionPool.getTransactionPing(transactions[0].id)).toEqual(10)
    })

    it('should not call pingTransaction', async () => {
      const amount = 10000000 // a bit less than the delegates' balance
      const transactions = generateTransfers(
        'testnet',
        delegates[0].secret,
        delegates[1].address,
        amount,
        1,
        true,
      )

      transactionPool.pingTransaction = jest.fn()

      await guard.validate(transactions)

      expect(transactionPool.pingTransaction).not.toHaveBeenCalled()
    })
  })

  describe('__transformAndFilterTransactions', () => {
    it('should be a function', () => {
      expect(guard.__transformAndFilterTransactions).toBeFunction()
    })

    it('should reject duplicate transactions', () => {
      guard.pool.transactionExists = jest.fn(() => true)
      guard.pool.pingTransaction = jest.fn(() => true)

      const tx = { id: '1' }
      guard.__transformAndFilterTransactions([tx])

      expect(guard.errors[tx.id]).toEqual([
        {
          message: `Duplicate transaction ${tx.id}`,
          type: 'ERR_DUPLICATE',
        },
      ])
    })

    it('should reject blocked senders', () => {
      guard.pool.transactionExists = jest.fn(() => false)
      const isSenderBlocked = guard.pool.isSenderBlocked
      guard.pool.isSenderBlocked = jest.fn(() => true)

      const tx = { id: '1', senderPublicKey: 'affe' }
      guard.__transformAndFilterTransactions([tx])

      expect(guard.errors[tx.id]).toEqual([
        {
          message: `Transaction ${tx.id} rejected. Sender ${tx.senderPublicKey} is blocked.`,
          type: 'ERR_SENDER_BLOCKED',
        },
      ])

      guard.pool.isSenderBlocked = isSenderBlocked
    })

    it('should reject transactions from the future', () => {
      const now = 47157042 // seconds since genesis block
      guard.pool.transactionExists = jest.fn(() => false)
      const getTime = slots.getTime
      slots.getTime = jest.fn(() => now)

      const secondsInFuture = 3601
      const tx = {
        id: '1',
        senderPublicKey: 'affe',
        timestamp: slots.getTime() + secondsInFuture,
      }
      guard.__transformAndFilterTransactions([tx])

      expect(guard.errors[tx.id]).toEqual([
        {
          message: `Transaction ${tx.id} is ${secondsInFuture} seconds in the future`,
          type: 'ERR_FROM_FUTURE',
        },
      ])

      slots.getTime = getTime
    })
  })

  describe('__determineValidTransactions', () => {
    it('should be a function', () => {
      expect(guard.__determineValidTransactions).toBeFunction()
    })
  })

  describe('__determineExcessTransactions', () => {
    it('should be a function', () => {
      expect(guard.__determineExcessTransactions).toBeFunction()
    })
  })

  describe('__determineFeeMatchingTransactions', () => {
    it('should be a function', () => {
      expect(guard.__determineFeeMatchingTransactions).toBeFunction()
    })
  })

  describe('__pushError', () => {
    it('should be a function', () => {
      expect(guard.__pushError).toBeFunction()
    })

    it('should have error for transaction', () => {
      expect(guard.errors).toBeEmpty()

      guard.__pushError({ id: 1 }, 'ERR_INVALID', 'Invalid.')

      expect(guard.errors).toBeObject()
      expect(guard.errors['1']).toBeArray()
      expect(guard.errors['1']).toHaveLength(1)
      expect(guard.errors['1']).toEqual([
        { message: 'Invalid.', type: 'ERR_INVALID' },
      ])

      expect(guard.invalid.size).toEqual(1)
      expect(guard.invalid.entries().next().value[1]).toEqual({ id: 1 })
    })

    it('should have multiple errors for transaction', () => {
      expect(guard.errors).toBeEmpty()

      guard.__pushError({ id: 1 }, 'ERR_INVALID', 'Invalid 1.')
      guard.__pushError({ id: 1 }, 'ERR_INVALID', 'Invalid 2.')

      expect(guard.errors).toBeObject()
      expect(guard.errors['1']).toBeArray()
      expect(guard.errors['1']).toHaveLength(2)
      expect(guard.errors['1']).toEqual([
        { message: 'Invalid 1.', type: 'ERR_INVALID' },
        { message: 'Invalid 2.', type: 'ERR_INVALID' },
      ])

      expect(guard.invalid.size).toEqual(1)
      expect(guard.invalid.entries().next().value[1]).toEqual({ id: 1 })
    })
  })
})
