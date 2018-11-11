const loggerManager = require('../lib/manager')

class FakeDriver {
  make() {
    return this
  }
}

describe('Config Manager', () => {
  it('should be an object', () => {
    expect(loggerManager).toBeObject()
    expect(loggerManager.drivers).toBeDefined()
  })

  describe('driver', () => {
    it('should be a function', () => {
      expect(loggerManager.driver).toBeFunction()
    })

    it('should return the driver', async () => {
      await loggerManager.makeDriver(new FakeDriver())

      expect(loggerManager.driver()).toBeInstanceOf(FakeDriver)
    })
  })

  describe('makeDriver', () => {
    it('should be a function', () => {
      expect(loggerManager.makeDriver).toBeFunction()
    })
  })
})
