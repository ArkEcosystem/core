const transactionPoolManager = require('../lib/manager')

class FakeDriver {
  make() {
    return this
  }
}

describe('Transaction Pool Manager', () => {
  it('should be an object', () => {
    expect(transactionPoolManager).toBeObject()
  })

  describe('connection', () => {
    it('should be a function', () => {
      expect(transactionPoolManager.connection).toBeFunction()
    })

    it('should return the drive-connection', async () => {
      await transactionPoolManager.makeConnection(new FakeDriver())

      expect(transactionPoolManager.connection()).toBeInstanceOf(FakeDriver)
    })

    it('should return the drive-connection for a different name', async () => {
      await transactionPoolManager.makeConnection(new FakeDriver(), 'testing')

      expect(transactionPoolManager.connection('testing')).toBeInstanceOf(
        FakeDriver,
      )
    })
  })

  describe('makeConnection', () => {
    it('should be a function', () => {
      expect(transactionPoolManager.makeConnection).toBeFunction()
    })
  })
})
