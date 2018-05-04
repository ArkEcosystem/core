'use strict'

const PinoDriver = require('../lib/driver')

let logger
beforeAll(() => {
  logger = new PinoDriver(require('../lib/defaults.js'))
})

describe('Logger', () => {
  it('should be an object', async () => {
    await expect(logger).toBeInstanceOf(PinoDriver)
  })

  describe('error', async () => {
    it('should be a function', async () => {
      await expect(logger.error).toBeFunction()
    })
  })

  describe('warn', async () => {
    it('should be a function', async () => {
      await expect(logger.warn).toBeFunction()
    })
  })

  describe('info', async () => {
    it('should be a function', async () => {
      await expect(logger.info).toBeFunction()
    })
  })

  describe('debug', async () => {
    it('should be a function', async () => {
      await expect(logger.debug).toBeFunction()
    })
  })

  describe('printTracker', async () => {
    it('should be a function', async () => {
      await expect(logger.printTracker).toBeFunction()
    })
  })

  describe('stopTracker', async () => {
    it('should be a function', async () => {
      await expect(logger.stopTracker).toBeFunction()
    })
  })
})
