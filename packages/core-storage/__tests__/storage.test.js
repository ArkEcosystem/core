'use strict'

const immutable = require('immutable')
const Storage = require('../lib/storage')

let testSubject
beforeEach(() => {
  testSubject = new Storage()
})

describe('Storage', () => {
  describe('all', () => {
    it('should be a function', () => {
      expect(testSubject.all).toBeFunction()
    })

    it('should get the storage', () => {
      expect(testSubject.all()).toBeInstanceOf(immutable.Map)
    })
  })

  describe('entries', () => {
    it('should be a function', () => {
      expect(testSubject.entries).toBeFunction()
    })

    it('should get all entries', () => {
      testSubject.setList('dummy', [1, 2, 3, 4, 5])

      expect(testSubject.entries()).toBeObject()
      expect(testSubject.entries()).not.toBeEmpty()
    })
  })

  describe('keys', () => {
    it('should be a function', () => {
      expect(testSubject.keys).toBeFunction()
    })

    it('should get all keys', () => {
      testSubject.setList('dummy', [1, 2, 3, 4, 5])

      expect(testSubject.keys()).toBeObject()
      expect(testSubject.keys()).not.toBeEmpty()
    })
  })

  describe('values', () => {
    it('should be a function', () => {
      expect(testSubject.values).toBeFunction()
    })

    it('should get all values', () => {
      testSubject.setList('dummy', [1, 2, 3, 4, 5])

      expect(testSubject.values()).toBeObject()
      expect(testSubject.values()).not.toBeEmpty()
    })
  })

  describe('get', () => {
    it('should be a function', () => {
      expect(testSubject.get).toBeFunction()
    })

    it('should get the item', () => {
      const value = [1, 2, 3, 4, 5]
      testSubject.setList('dummy', value)

      expect(testSubject.get('dummy')).toEqual(immutable.List(value))
    })

    it('should throw if an item does not exist', () => {
      expect(() => {
        testSubject.get('dummy')
      }).toThrow()
    })
  })

  describe('set', () => {
    it('should be a function', () => {
      expect(testSubject.set).toBeFunction()
    })

    it('should set the item', () => {
      expect(testSubject.size()).toBe(0)

      testSubject.set('dummy', immutable.List([1, 2, 3, 4, 5]))

      expect(testSubject.size()).toBe(1)
    })

    it('should throw if an item exists', () => {
      testSubject.setList('dummy', [1, 2, 3, 4, 5])

      expect(() => {
        testSubject.set('dummy')
      }).toThrow()
    })
  })

  describe('has', () => {
    it('should be a function', () => {
      expect(testSubject.has).toBeFunction()
    })

    it('should be true if the item exists', () => {
      testSubject.setList('dummy', [1, 2, 3, 4, 5])

      expect(testSubject.has('dummy')).toBeTrue()
    })

    it('should be false if the item does not exist', () => {
      expect(testSubject.has('dummy')).toBeFalse()
    })
  })

  describe('forget', () => {
    it('should be a function', () => {
      expect(testSubject.forget).toBeFunction()
    })

    it('should forget the item', () => {
      const value = [1, 2, 3, 4, 5]
      testSubject.setList('dummy', value)

      expect(testSubject.get('dummy')).toEqual(immutable.List(value))
      expect(testSubject.size()).toBe(1)

      testSubject.forget('dummy')

      expect(testSubject.size()).toBe(0)
    })

    it('should throw if an item does not exist', () => {
      expect(() => {
        testSubject.get('dummy')
      }).toThrow()
    })
  })

  describe('clear', () => {
    it('should be a function', () => {
      expect(testSubject.clear).toBeFunction()
    })

    it('should empty the storage', () => {
      testSubject.setList('dummy', [1, 2, 3, 4, 5])

      expect(testSubject.size()).toBe(1)

      testSubject.clear()

      expect(testSubject.size()).toBe(0)
    })
  })

  describe('size', () => {
    it('should be a function', () => {
      expect(testSubject.size).toBeFunction()
    })

    it('should get the size of the whole storage', () => {
      testSubject.setList('dummy', [1, 2, 3, 4, 5])

      expect(testSubject.size()).toBe(1)
    })
  })
})
