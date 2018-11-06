'use strict'

const capcon = require('capture-console')
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
  it('should be an object', () => {
    expect(logger).toBeObject()
  })

  describe('error', () => {
    it('should be a function', () => {
      expect(logger.error).toBeFunction()
    })

    it('should log a message', () => {
      logger.info('error_message')

      expect(message).toMatch(/error/)
      expect(message).toMatch(/error_message/)
      message = null
    })
  })

  describe('warn', () => {
    it('should be a function', () => {
      expect(logger.warn).toBeFunction()
    })

    it('should log a message', () => {
      logger.info('warning_message')

      expect(message).toMatch(/warn/)
      expect(message).toMatch(/warning_message/)
      message = null
    })
  })

  describe('info', () => {
    it('should be a function', () => {
      expect(logger.info).toBeFunction()
    })

    it('should log a message', () => {
      logger.info('info_message')

      expect(message).toMatch(/info/)
      expect(message).toMatch(/info_message/)
      message = null
    })
  })

  describe('debug', () => {
    it('should be a function', () => {
      expect(logger.debug).toBeFunction()
    })

    it('should log a message', () => {
      logger.info('debug_message')

      expect(message).toMatch(/debug/)
      expect(message).toMatch(/debug_message/)
      message = null
    })
  })

  describe('printTracker', () => {
    it('should be a function', () => {
      expect(logger.printTracker).toBeFunction()
    })

    it('should print the tracker', () => {
      logger.printTracker('test_title', 50, 100, 'done')

      expect(message).toMatch(/test_title/)
      expect(message).toMatch(/=========================/)
      expect(message).toMatch(/50/)
      expect(message).toMatch(/done/)
      message = null
    })
  })

  describe('stopTracker', () => {
    it('should be a function', () => {
      expect(logger.stopTracker).toBeFunction()
    })

    it('should stop the tracker', () => {
      logger.stopTracker('test_title', 50, 100)

      expect(message).toMatch(/test_title/)
      expect(message).toMatch(/=========================/)
      expect(message).toMatch(/50/)
      message = null
    })
  })
})
