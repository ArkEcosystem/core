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
      testSubject.createList('dummy', value)

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
      testSubject.createList('dummy', [1, 2, 3, 4, 5])

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
      testSubject.createList('dummy', [1, 2, 3, 4, 5])

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
      testSubject.createList('dummy', value)

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

  describe('flush', () => {
    it('should be a function', () => {
      expect(testSubject.flush).toBeFunction()
    })

    it('should empty the storage', () => {
      testSubject.createList('dummy', [1, 2, 3, 4, 5])

      expect(testSubject.size()).toBe(1)

      testSubject.flush()

      expect(testSubject.size()).toBe(0)
    })
  })

  describe('size', () => {
    it('should be a function', () => {
      expect(testSubject.size).toBeFunction()
    })

    it('should get the size of the whole storage', () => {
      testSubject.createList('dummy', [1, 2, 3, 4, 5])

      expect(testSubject.size()).toBe(1)
    })

    it('should get the size of the whole storage', () => {
      testSubject.createList('items.dummy', [1, 2, 3, 4, 5])

      expect(testSubject.size('items')).toBe(1)
    })
  })

  describe('createList', () => {
    it('should be a function', () => {
      expect(testSubject.createList).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createList('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.List)
    })
  })

  describe('createMap', () => {
    it('should be a function', () => {
      expect(testSubject.createMap).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createMap('dummy', { key: 'value' })

      expect(actual).toBeInstanceOf(immutable.Map)
    })
  })

  describe('createOrderedMap', () => {
    it('should be a function', () => {
      expect(testSubject.createOrderedMap).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createOrderedMap('dummy', { key: 'value' })

      expect(actual).toBeInstanceOf(immutable.OrderedMap)
    })
  })

  describe('createSet', () => {
    it('should be a function', () => {
      expect(testSubject.createSet).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createSet('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Set)
    })
  })

  describe('createOrderedSet', () => {
    it('should be a function', () => {
      expect(testSubject.createOrderedSet).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createOrderedSet('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.OrderedSet)
    })
  })

  describe('createStack', () => {
    it('should be a function', () => {
      expect(testSubject.createStack).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createStack('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Stack)
    })
  })

  describe('createRange', () => {
    it('should be a function', () => {
      expect(testSubject.createRange).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createRange('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Range)
    })
  })

  describe('createRepeat', () => {
    it('should be a function', () => {
      expect(testSubject.createRepeat).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createRepeat('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Repeat)
    })
  })

  describe('createRecord', () => {
    it('should be a function', () => {
      expect(testSubject.createRecord).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createRecord('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeFunction()
    })
  })

  describe('createSeq', () => {
    it('should be a function', () => {
      expect(testSubject.createSeq).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createSeq('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })

  describe('createSeqKeyed', () => {
    it('should be a function', () => {
      expect(testSubject.createSeqKeyed).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createSeqKeyed('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq.Keyed)
    })
  })

  describe('createSeqIndexed', () => {
    it('should be a function', () => {
      expect(testSubject.createSeqIndexed).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createSeqIndexed('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq.Indexed)
    })
  })

  describe('createSeqSet', () => {
    it('should be a function', () => {
      expect(testSubject.createSeqSet).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createSeqSet('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq.Set)
    })
  })

  describe('createCollection', () => {
    it('should be a function', () => {
      expect(testSubject.createCollection).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createCollection('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Collection)
    })
  })

  describe('createCollectionKeyed', () => {
    it('should be a function', () => {
      expect(testSubject.createCollectionKeyed).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createCollectionKeyed('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })

  describe('createCollectionIndexed', () => {
    it('should be a function', () => {
      expect(testSubject.createCollectionIndexed).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createCollectionIndexed('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })

  describe('createCollectionSet', () => {
    it('should be a function', () => {
      expect(testSubject.createCollectionSet).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createCollectionSet('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })
})
