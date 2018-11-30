const dayjs = require('dayjs-ext')
const app = require('./__support__/setup')

let poolInterface

beforeAll(async () => {
  const container = await app.setUp()
  await container.resolvePlugin('blockchain').start()

  poolInterface = new (require('../lib/interface'))({ enabled: false })
})

afterAll(async () => {
  await app.tearDown()
})

describe('Transaction Pool Interface', () => {
  it('should be an object', () => {
    expect(poolInterface).toBeObject()
  })

  describe('driver', () => {
    it('should be a function', () => {
      expect(poolInterface.driver).toBeFunction()
    })
  })

  describe('getPoolSize', () => {
    it('should be a function', () => {
      expect(poolInterface.getPoolSize).toBeFunction()
    })

    it('should throw an exception', () => {
      expect(poolInterface.getPoolSize).toThrow(
        'Method [getPoolSize] not implemented!',
      )
    })
  })

  describe('getSenderSize', () => {
    it('should be a function', () => {
      expect(poolInterface.getSenderSize).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(poolInterface.getSenderSize).toThrow(
        'Method [getSenderSize] not implemented!',
      )
    })
  })

  describe('addTransaction', () => {
    it('should be a function', () => {
      expect(poolInterface.addTransaction).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(poolInterface.addTransaction).toThrow(
        'Method [addTransaction] not implemented!',
      )
    })
  })

  describe('removeTransaction', () => {
    it('should be a function', () => {
      expect(poolInterface.removeTransaction).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(poolInterface.removeTransaction).toThrow(
        'Method [removeTransaction] not implemented!',
      )
    })
  })

  describe('getTransaction', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransaction).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(poolInterface.getTransaction).toThrow(
        'Method [getTransaction] not implemented!',
      )
    })
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransactions).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(poolInterface.getTransactions).toThrow(
        'Method [getTransactions] not implemented!',
      )
    })
  })

  describe('getTransactionsForForging', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransactionsForForging).toBeFunction()
    })

    it('should throw an exception', () => {
      expect(poolInterface.getTransactionsForForging).toThrow(
        'Method [getTransactionsForForging] not implemented!',
      )
    })
  })

  describe('getTransactionIdsForForging', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransactionIdsForForging).toBeFunction()
    })

    it('should throw an exception', () => {
      expect(poolInterface.getTransactionIdsForForging).toThrow(
        'Method [getTransactionIdsForForging] not implemented!',
      )
    })
  })

  describe('hasExceededMaxTransactions', () => {
    it('should be a function', () => {
      expect(poolInterface.hasExceededMaxTransactions).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(poolInterface.hasExceededMaxTransactions).toThrow(
        'Method [hasExceededMaxTransactions] not implemented!',
      )
    })
  })

  describe('senderHasTransactionsOfType', () => {
    it('should be a function', () => {
      expect(poolInterface.senderHasTransactionsOfType).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(poolInterface.senderHasTransactionsOfType).toThrow(
        'Method [senderHasTransactionsOfType] not implemented!',
      )
    })
  })

  describe('transactionExists', () => {
    it('should be a function', () => {
      expect(poolInterface.transactionExists).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(poolInterface.transactionExists).toThrow(
        'Method [transactionExists] not implemented!',
      )
    })
  })

  describe('removeTransactionsForSender', () => {
    it('should be a function', () => {
      expect(poolInterface.removeTransactionsForSender).toBeFunction()
    })

    it('should throw an exception', async () => {
      expect(poolInterface.removeTransactionsForSender).toThrow(
        'Method [removeTransactionsForSender] not implemented!',
      )
    })
  })

  describe('isSenderBlocked', () => {
    it('should be a function', () => {
      expect(poolInterface.isSenderBlocked).toBeFunction()
    })

    it('should return true', async () => {
      poolInterface.blockSender('keykeykey')
      expect(poolInterface.isSenderBlocked('keykeykey')).toBeTrue()
    })

    it('should return false', async () => {
      expect(poolInterface.isSenderBlocked('keykeykey2')).toBeFalse()
    })
  })

  describe('blockSender', () => {
    it('should be a function', () => {
      expect(poolInterface.blockSender).toBeFunction()
    })

    it('should block sender for specified time', async () => {
      const time = dayjs()
      const blockedTime = poolInterface.blockSender('keykeykey')
      const duration = blockedTime.diff(time) / 1000 / 60 / 60

      expect(poolInterface.isSenderBlocked('keykeykey')).toBeTrue()
      expect(parseInt(duration)).toEqual(1)
    })
  })

  describe('acceptChainedBlock', () => {
    it('should be a function', () => {
      expect(poolInterface.acceptChainedBlock).toBeFunction()
    })
  })

  describe('buildWallets', () => {
    it('should be a function', () => {
      expect(poolInterface.buildWallets).toBeFunction()
    })
  })

  describe('purgeByPublicKey', () => {
    it('should be a function', () => {
      expect(poolInterface.purgeByPublicKey).toBeFunction()
    })
  })
})
