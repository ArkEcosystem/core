'use strict'

const immutable = require('immutable')
const Storage = require('../lib/storage')

let testSubject
beforeEach(() => {
  testSubject = new Storage()
})

describe('Storage', () => {
  describe('createList', () => {
    it('should be a function', () => {
      expect(testSubject.createList).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createList([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.List)
    })
  })

  describe('createMap', () => {
    it('should be a function', () => {
      expect(testSubject.createMap).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createMap({ key: 'value' })

      expect(actual).toBeInstanceOf(immutable.Map)
    })
  })

  describe('createOrderedMap', () => {
    it('should be a function', () => {
      expect(testSubject.createOrderedMap).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createOrderedMap({ key: 'value' })

      expect(actual).toBeInstanceOf(immutable.OrderedMap)
    })
  })

  describe('createSet', () => {
    it('should be a function', () => {
      expect(testSubject.createSet).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createSet([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Set)
    })
  })

  describe('createOrderedSet', () => {
    it('should be a function', () => {
      expect(testSubject.createOrderedSet).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createOrderedSet([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.OrderedSet)
    })
  })

  describe('createStack', () => {
    it('should be a function', () => {
      expect(testSubject.createStack).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createStack([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Stack)
    })
  })

  describe('createRange', () => {
    it('should be a function', () => {
      expect(testSubject.createRange).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createRange([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Range)
    })
  })

  describe('createRepeat', () => {
    it('should be a function', () => {
      expect(testSubject.createRepeat).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createRepeat([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Repeat)
    })
  })

  describe('createRecord', () => {
    it('should be a function', () => {
      expect(testSubject.createRecord).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createRecord([1, 2, 3, 4, 5])

      expect(actual).toBeFunction()
    })
  })

  describe('createSeq', () => {
    it('should be a function', () => {
      expect(testSubject.createSeq).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createSeq([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })

  describe('createSeqKeyed', () => {
    it('should be a function', () => {
      expect(testSubject.createSeqKeyed).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createSeqKeyed([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq.Keyed)
    })
  })

  describe('createSeqIndexed', () => {
    it('should be a function', () => {
      expect(testSubject.createSeqIndexed).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createSeqIndexed([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq.Indexed)
    })
  })

  describe('createSeqSet', () => {
    it('should be a function', () => {
      expect(testSubject.createSeqSet).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createSeqSet([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq.Set)
    })
  })

  describe('createCollection', () => {
    it('should be a function', () => {
      expect(testSubject.createCollection).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createCollection([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Collection)
    })
  })

  describe('createCollectionKeyed', () => {
    it('should be a function', () => {
      expect(testSubject.createCollectionKeyed).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createCollectionKeyed([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })

  describe('createCollectionIndexed', () => {
    it('should be a function', () => {
      expect(testSubject.createCollectionIndexed).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createCollectionIndexed([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })

  describe('createCollectionSet', () => {
    it('should be a function', () => {
      expect(testSubject.createCollectionSet).toBeFunction()
    })

    it('should create a new immutable object', () => {
      const actual = testSubject.createCollectionSet([1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })
})
