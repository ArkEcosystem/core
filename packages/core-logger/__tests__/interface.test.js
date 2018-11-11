const LoggerInterface = require('../lib/interface')

const logger = new LoggerInterface()

describe('Logger Interface', () => {
  it('should be an object', () => {
    expect(logger).toBeObject()
  })

  describe('driver', () => {
    it('should be a function', () => {
      expect(logger.driver).toBeFunction()
    })
  })

  describe('error', () => {
    it('should be a function', () => {
      expect(logger.error).toBeFunction()
    })
  })

  describe('warning', () => {
    it('should be a function', () => {
      expect(logger.warn).toBeFunction()
    })
  })

  describe('info', () => {
    it('should be a function', () => {
      expect(logger.info).toBeFunction()
    })
  })

  describe('debug', () => {
    it('should be a function', () => {
      expect(logger.debug).toBeFunction()
    })
  })

  describe('printTracker', () => {
    it('should be a function', () => {
      expect(logger.printTracker).toBeFunction()
    })
  })

  describe('stopTracker', () => {
    it('should be a function', () => {
      expect(logger.stopTracker).toBeFunction()
    })
  })

  describe('suppressConsoleOutput', () => {
    it('should be a function', () => {
      expect(logger.suppressConsoleOutput).toBeFunction()
    })
  })
})
