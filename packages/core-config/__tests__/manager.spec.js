'use strict';

const configManager = require('../lib/manager')

class FakeDriver {
  make () {
    return this
  }
}

describe('Config Manager', () => {
  it('should be an object', async () => {
    expect(configManager).toBeObject()
    expect(configManager.drivers).toBeDefined()
  })

  describe('driver', async () => {
    it('should be a function', async () => {
      expect(configManager.driver).toBeFunction()
    })

    it('should return the driver', async () => {
      await configManager.makeDriver(new FakeDriver())

      expect(configManager.driver()).toBeInstanceOf(FakeDriver)
    })
  })

  describe('makeDriver', async () => {
    it('should be a function', async () => {
      expect(configManager.makeDriver).toBeFunction()
    })
  })
})
