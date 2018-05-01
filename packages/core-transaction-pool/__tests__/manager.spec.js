'use strict';

const transactionPoolManager = require('../lib/manager')

class FakeDriver {
  make () {
    return this
  }
}

describe('Config Transaction Pool Manager', () => {
  it('should be an object', async () => {
    expect(transactionPoolManager).toBeObject()
    expect(transactionPoolManager.drivers).toBeDefined()
  })

  describe('connection', async () => {
    it('should be a function', async () => {
      expect(transactionPoolManager.connection).toBeFunction()
    })

    it('should return the drive-connection', async () => {
      await transactionPoolManager.makeConnection(new FakeDriver())

      expect(transactionPoolManager.connection()).toBeInstanceOf(FakeDriver)
    })
  })

  describe('makeConnection', async () => {
    it('should be a function', async () => {
      expect(transactionPoolManager.makeConnection).toBeFunction()
    })
  })
})
