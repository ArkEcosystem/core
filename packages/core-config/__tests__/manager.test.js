'use strict'

const configManager = require('../lib/manager')

class FakeDriver {
  make () {
    return this
  }
}

describe('Config Manager', () => {
  it('should be an object', () => {
    expect(configManager).toBeObject()
    expect(configManager.drivers).toBeDefined()
  })

  describe('driver', () => {
    it('should be a function', () => {
      expect(configManager.driver).toBeFunction()
    })

    it('should return the driver', async () => {
      await configManager.makeDriver(new FakeDriver())

      expect(configManager.driver()).toBeInstanceOf(FakeDriver)
    })
  })

  describe('makeDriver', () => {
    it('should be a function', () => {
      expect(configManager.makeDriver).toBeFunction()
    })
  })
})
