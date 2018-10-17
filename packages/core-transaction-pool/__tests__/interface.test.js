'use strict'

const app = require('./__support__/setup')
const moment = require('moment')

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

    it('should throw an exception', async () => {
      await expect(poolInterface.getPoolSize()).rejects.toThrowError('Method [getPoolSize] not implemented!')
    })
  })

  describe('getSenderSize', () => {
    it('should be a function', () => {
      expect(poolInterface.getSenderSize).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.getSenderSize()).rejects.toThrowError('Method [getSenderSize] not implemented!')
    })
  })

  describe('addTransaction', () => {
    it('should be a function', () => {
      expect(poolInterface.addTransaction).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.addTransaction()).rejects.toThrowError('Method [addTransaction] not implemented!')
    })
  })

  describe('removeTransaction', () => {
    it('should be a function', () => {
      expect(poolInterface.removeTransaction).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.removeTransaction()).rejects.toThrowError('Method [removeTransaction] not implemented!')
    })
  })

  describe('removeTransactions', () => {
    it('should be a function', () => {
      expect(poolInterface.removeTransactions).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.removeTransactions()).rejects.toThrowError('Method [removeTransactions] not implemented!')
    })
  })

  describe('getTransaction', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransaction).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.getTransaction()).rejects.toThrowError('Method [getTransaction] not implemented!')
    })
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransactions).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.getTransactions()).rejects.toThrowError('Method [getTransactions] not implemented!')
    })
  })

  describe('getTransactionsForForging', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransactionsForForging).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.getTransactionsForForging()).rejects.toThrowError('Method [getTransactionsForForging] not implemented!')
    })
  })

  describe('getTransactionIdsForForging', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransactionIdsForForging).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.getTransactionIdsForForging()).rejects.toThrowError('Method [getTransactionIdsForForging] not implemented!')
    })
  })

  describe('hasExceededMaxTransactions', () => {
    it('should be a function', () => {
      expect(poolInterface.hasExceededMaxTransactions).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.hasExceededMaxTransactions()).rejects.toThrowError('Method [hasExceededMaxTransactions] not implemented!')
    })
  })

  describe('transactionExists', () => {
    it('should be a function', () => {
      expect(poolInterface.transactionExists).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.transactionExists()).rejects.toThrowError('Method [transactionExists] not implemented!')
    })
  })

  describe('removeTransactionsForSender', () => {
    it('should be a function', () => {
      expect(poolInterface.removeTransactionsForSender).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(poolInterface.removeTransactionsForSender()).rejects.toThrowError('Method [removeTransactionsForSender] not implemented!')
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
      const time = moment()
      const blockedTime = poolInterface.blockSender('keykeykey')
      const duration = moment.duration(blockedTime.diff(time))

      expect(poolInterface.isSenderBlocked('keykeykey')).toBeTrue()
      expect(parseInt(duration.asHours())).toEqual(1)
    })
  })

  describe('getTransactionsForForging', () => {
    it('should be a function', () => {
      expect(poolInterface.getTransactionsForForging).toBeFunction()
    })
  })

  describe('removeForgedAndGetPending', () => {
    it('should be a function', () => {
      expect(poolInterface.removeForgedAndGetPending).toBeFunction()
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

  describe('checkApplyToBlockchain', () => {
    it('should be a function', () => {
      expect(poolInterface.checkApplyToBlockchain).toBeFunction()
    })
  })

  describe('checkDynamicFeeMatch', () => {
    it('should be a function', () => {
      expect(poolInterface.checkDynamicFeeMatch).toBeFunction()
    })
  })
})
