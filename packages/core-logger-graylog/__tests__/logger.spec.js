'use strict';

const path = require('path')
const logger = require('../src/logger')

describe('Logger', () => {
  it('should be an object', async () => {
    await expect(logger).toBeObject()
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
