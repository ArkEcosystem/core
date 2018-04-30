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

  describe('driver', async () => {
    it('should be a function', async () => {
      expect(transactionPoolManager.driver).toBeFunction()
    })

    it('should return the driver', async () => {
      await transactionPoolManager.makeDriver(new FakeDriver())

      expect(transactionPoolManager.driver()).toBeInstanceOf(FakeDriver)
    })
  })

  describe('makeDriver', async () => {
    it('should be a function', async () => {
      expect(transactionPoolManager.makeDriver).toBeFunction()
    })
  })
})
