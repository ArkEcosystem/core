'use strict'

const loggerManager = require('../lib/manager')

class FakeDriver {
  make () {
    return this
  }
}

describe('Config Manager', () => {
  it('should be an object', async () => {
    expect(loggerManager).toBeObject()
    expect(loggerManager.drivers).toBeDefined()
  })

  describe('driver', async () => {
    it('should be a function', async () => {
      expect(loggerManager.driver).toBeFunction()
    })

    it('should return the driver', async () => {
      await loggerManager.makeDriver(new FakeDriver())

      expect(loggerManager.driver()).toBeInstanceOf(FakeDriver)
    })
  })

  describe('makeDriver', async () => {
    it('should be a function', async () => {
      expect(loggerManager.makeDriver).toBeFunction()
    })
  })
})
