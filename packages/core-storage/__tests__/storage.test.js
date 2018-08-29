'use strict'

const immutable = require('immutable')
const Storage = require('../lib/storage')

let testSubject
beforeEach(() => {
  testSubject = new Storage()
})

describe('Storage', () => {
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
