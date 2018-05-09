'use strict'

const capcon = require('capture-console')
const winston = require('winston')
const WinstonDriver = require('../lib/driver')

let logger
let message

beforeAll(() => {
  const driver = new WinstonDriver({
    transports: [{
      constructor: 'Console'
    }]
  })

  logger = driver.make()

  capcon.startCapture(process.stdout, (stdout) => (message += stdout))
})

describe('Logger', () => {
  it('should be an object', async() => {
    await expect(logger).toBeInstanceOf(winston.Logger)
  })

  describe('error', async() => {
    it('should be a function', async() => {
      await expect(logger.error).toBeFunction()
    })

    it('should log a message', async() => {
      logger.info('error_message')

      await expect(message).toMatch(/error/)
      await expect(message).toMatch(/error_message/)
      message = null
    })
  })

  describe('warn', async() => {
    it('should be a function', async() => {
      await expect(logger.warn).toBeFunction()
    })

    it('should log a message', async() => {
      logger.info('warning_message')

      await expect(message).toMatch(/warn/)
      await expect(message).toMatch(/warning_message/)
      message = null
    })
  })

  describe('info', async() => {
    it('should be a function', async() => {
      await expect(logger.info).toBeFunction()
    })

    it('should log a message', async() => {
      logger.info('info_message')

      await expect(message).toMatch(/info/)
      await expect(message).toMatch(/info_message/)
      message = null
    })
  })

  describe('debug', async() => {
    it('should be a function', async() => {
      await expect(logger.debug).toBeFunction()
    })

    it('should log a message', async() => {
      logger.info('debug_message')

      await expect(message).toMatch(/debug/)
      await expect(message).toMatch(/debug_message/)
      message = null
    })
  })

  describe('printTracker', async() => {
    it('should be a function', async() => {
      await expect(logger.printTracker).toBeFunction()
    })

    it('should print the tracker', async() => {
      logger.printTracker('test_title', 50, 100, 'done')

      await expect(message).toMatch(/test_title/)
      await expect(message).toMatch(/=========================/)
      await expect(message).toMatch(/50/)
      await expect(message).toMatch(/done/)
      message = null
    })
  })

  describe('stopTracker', async() => {
    it('should be a function', async() => {
      await expect(logger.stopTracker).toBeFunction()
    })

    it('should stop the tracker', async() => {
      logger.stopTracker('test_title', 50, 100)

      await expect(message).toMatch(/test_title/)
      await expect(message).toMatch(/=========================/)
      await expect(message).toMatch(/50/)
      message = null
    })
  })
})
