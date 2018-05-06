'use strict'

const transactionPoolManager = require('../lib/manager')

class FakeDriver {
  make () {
    return this
  }
}

describe('Config Transaction Pool Manager', () => {
  it('should be an object', async () => {
    expect(transactionPoolManager).toBeObject()
  })

  describe('connection', async () => {
    it('should be a function', async () => {
      expect(transactionPoolManager.connection).toBeFunction()
    })

    it('should return the drive-connection', async () => {
      await transactionPoolManager.makeConnection(new FakeDriver())

      expect(transactionPoolManager.connection()).toBeInstanceOf(FakeDriver)
    })

    it('should return the drive-connection for a different name', async () => {
      await transactionPoolManager.makeConnection(new FakeDriver(), 'testing')

      expect(transactionPoolManager.connection('testing')).toBeInstanceOf(FakeDriver)
    })
  })

  describe('makeConnection', async () => {
    it('should be a function', async () => {
      expect(transactionPoolManager.makeConnection).toBeFunction()
    })
  })
})
