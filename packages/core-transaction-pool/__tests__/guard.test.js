'use strict'

const app = require('./__support__/setup')

let guard

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  const poolInterface = new (require('../lib/interface'))({})
  guard = new (require('../lib/guard'))(poolInterface)
})

describe('Transaction Guard', () => {
  it('should be an object', () => {
    expect(guard).toBeObject()
  })

  describe('validate', () => {
    it('should be a function', () => {
      expect(guard.validate).toBeFunction()
    })
  })

  describe('getIds', () => {
    it('should be a function', () => {
      expect(guard.getIds).toBeFunction()
    })

    it('should be ok', () => {
      guard.transactions = [{ id: 1 }]
      guard.accept = [{ id: 2 }]
      guard.excess = [{ id: 3 }]
      guard.invalid = [{ id: 4 }]
      guard.broadcast = [{ id: 5 }]

      expect(guard.getIds()).toEqual({
        transactions: [1],
        accept: [2],
        excess: [3],
        invalid: [4],
        broadcast: [5]
      })
    })

    it('should be ok using a type', () => {
      guard.excess = [{ id: 3 }]

      expect(guard.getIds('excess')).toEqual([3])
    })
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(guard.getTransactions).toBeFunction()
    })

    it('should be ok', () => {
      guard.transactions = [{ id: 1 }]
      guard.accept = [{ id: 2 }]
      guard.excess = [{ id: 3 }]
      guard.invalid = [{ id: 4 }]
      guard.broadcast = [{ id: 5 }]

      expect(guard.getTransactions()).toEqual({
        transactions: [{ id: 1 }],
        accept: [{ id: 2 }],
        excess: [{ id: 3 }],
        invalid: [{ id: 4 }],
        broadcast: [{ id: 5 }]
      })
    })

    it('should be ok using a type', () => {
      guard.excess = [{ id: 3 }]

      expect(guard.getTransactions('excess')).toEqual([{ id: 3 }])
    })
  })

  describe('has', () => {
    it('should be a function', () => {
      expect(guard.has).toBeFunction()
    })

    it('should be ok', () => {
      guard.excess = [{ id: 1 }, { id: 2 }]

      expect(guard.has('excess', 2)).toBeTruthy()
    })

    it('should not be ok', () => {
      guard.excess = [{ id: 1 }, { id: 2 }]

      expect(guard.has('excess', 1)).toBeFalsy()
    })
  })

  describe('hasAtLeast', () => {
    it('should be a function', () => {
      expect(guard.hasAtLeast).toBeFunction()
    })

    it('should be ok', () => {
      guard.excess = [{ id: 1 }, { id: 2 }]

      expect(guard.hasAtLeast('excess', 2)).toBeTruthy()
    })

    it('should not be ok', () => {
      guard.excess = [{ id: 1 }]

      expect(guard.hasAtLeast('excess', 2)).toBeFalsy()
    })
  })

  describe('hasAny', () => {
    it('should be a function', () => {
      expect(guard.hasAny).toBeFunction()
    })

    it('should be ok', () => {
      guard.excess = [{ id: 1 }]

      expect(guard.hasAny('excess')).toBeTruthy()
    })

    it('should not be ok', () => {
      guard.excess = []

      expect(guard.hasAny('excess')).toBeFalsy()
    })
  })

  describe('__transformAndFilterTransations', () => {
    it('should be a function', () => {
      expect(guard.__transformAndFilterTransations).toBeFunction()
    })
  })

  describe('__determineValidTransactions', () => {
    it('should be a function', () => {
      expect(guard.__determineValidTransactions).toBeFunction()
    })
  })

  describe('__determineExcessTransactions', () => {
    it('should be a function', () => {
      expect(guard.__determineExcessTransactions).toBeFunction()
    })
  })

  describe('__reset', () => {
    it('should be a function', () => {
      expect(guard.__reset).toBeFunction()
    })

    it('should be ok', () => {
      guard.transactions = [{ id: 1 }]
      guard.accept = [{ id: 2 }]
      guard.excess = [{ id: 3 }]
      guard.invalid = [{ id: 4 }]
      guard.broadcast = [{ id: 5 }]

      expect(guard.transactions).not.toBeEmpty()
      expect(guard.accept).not.toBeEmpty()
      expect(guard.excess).not.toBeEmpty()
      expect(guard.invalid).not.toBeEmpty()
      expect(guard.broadcast).not.toBeEmpty()

      guard.__reset()

      expect(guard.transactions).toBeEmpty()
      expect(guard.accept).toBeEmpty()
      expect(guard.excess).toBeEmpty()
      expect(guard.invalid).toBeEmpty()
      expect(guard.broadcast).toBeEmpty()
    })
  })
})
