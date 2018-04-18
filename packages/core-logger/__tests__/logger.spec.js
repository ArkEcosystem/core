'use strict';

const path = require('path')
const logger = require('../src/logger')

describe('Logger', () => {
  it('should be an object', async () => {
    await expect(logger).toBeObject()
  })

  it('[init] should be a function', async () => {
    await expect(logger.init).toBeFunction()
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

  it('[error] should be a function', async () => {
    await expect(logger.error).toBeFunction()
  })

  it('[warning] should be a function', async () => {
    await expect(logger.warning).toBeFunction()
  })

  it('[info] should be a function', async () => {
    await expect(logger.info).toBeFunction()
  })

  it('[debug] should be a function', async () => {
    await expect(logger.debug).toBeFunction()
  })

  it('[printTracker] should be a function', async () => {
    await expect(logger.printTracker).toBeFunction()
  })

  it('[stopTracker] should be a function', async () => {
    await expect(logger.stopTracker).toBeFunction()
  })
})
