'use strict';

const logger = require('../src/logger')

describe('Logger', () => {
  it('should be an object', async () => {
    await expect(logger).toBeObject()
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
