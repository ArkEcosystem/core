'use strict';

const logger = require('../lib/logger')

describe('Logger', () => {
  it('should be an object', async () => {
    await expect(logger).toBeObject()
  })

  describe('init', async () => {
    it('should be a function', async () => {
      await expect(logger.init).toBeFunction()
    })

    it('should return the logger', async () => {
      await expect(logger.init()).toBe(logger)
    })
  })

  describe('getDriver', async () => {
    it('should be a function', async () => {
      await expect(logger.getDriver).toBeFunction()
    })

    it('should return the driver', async () => {
      logger.setDriver('fake-driver')

      await expect(logger.getDriver()).toBe('fake-driver')
    })
  })

  describe('setDriver', async () => {
    it('should be a function', async () => {
      await expect(logger.setDriver).toBeFunction()
    })

    it('should set the driver', async () => {
      logger.setDriver('fake-driver')

      await expect(logger.driver).toBe('fake-driver')
    })
  })

  describe('error', async () => {
    it('should be a function', async () => {
      await expect(logger.error).toBeFunction()
    })
  })

  describe('warning', async () => {
    it('should be a function', async () => {
      await expect(logger.warning).toBeFunction()
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
