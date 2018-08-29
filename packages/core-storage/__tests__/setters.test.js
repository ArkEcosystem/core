'use strict'

const immutable = require('immutable')
const Storage = require('../lib/storage')

let testSubject
beforeEach(() => {
  testSubject = new Storage()
})

describe('Storage', () => {
  describe('setList', () => {
    it('should be a function', () => {
      expect(testSubject.setList).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setList('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.List)
    })
  })

  describe('setMap', () => {
    it('should be a function', () => {
      expect(testSubject.setMap).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setMap('dummy', { key: 'value' })

      expect(actual).toBeInstanceOf(immutable.Map)
    })
  })

  describe('setOrderedMap', () => {
    it('should be a function', () => {
      expect(testSubject.setOrderedMap).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setOrderedMap('dummy', { key: 'value' })

      expect(actual).toBeInstanceOf(immutable.OrderedMap)
    })
  })

  describe('setSet', () => {
    it('should be a function', () => {
      expect(testSubject.setSet).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setSet('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Set)
    })
  })

  describe('setOrderedSet', () => {
    it('should be a function', () => {
      expect(testSubject.setOrderedSet).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setOrderedSet('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.OrderedSet)
    })
  })

  describe('setStack', () => {
    it('should be a function', () => {
      expect(testSubject.setStack).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setStack('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Stack)
    })
  })

  describe('setRange', () => {
    it('should be a function', () => {
      expect(testSubject.setRange).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setRange('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Range)
    })
  })

  describe('setRepeat', () => {
    it('should be a function', () => {
      expect(testSubject.setRepeat).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setRepeat('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Repeat)
    })
  })

  describe('setRecord', () => {
    it('should be a function', () => {
      expect(testSubject.setRecord).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setRecord('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeFunction()
    })
  })

  describe('setSeq', () => {
    it('should be a function', () => {
      expect(testSubject.setSeq).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setSeq('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })

  describe('setSeqKeyed', () => {
    it('should be a function', () => {
      expect(testSubject.setSeqKeyed).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setSeqKeyed('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq.Keyed)
    })
  })

  describe('setSeqIndexed', () => {
    it('should be a function', () => {
      expect(testSubject.setSeqIndexed).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setSeqIndexed('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq.Indexed)
    })
  })

  describe('setSeqSet', () => {
    it('should be a function', () => {
      expect(testSubject.setSeqSet).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setSeqSet('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq.Set)
    })
  })

  describe('setCollection', () => {
    it('should be a function', () => {
      expect(testSubject.setCollection).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setCollection('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Collection)
    })
  })

  describe('setCollectionKeyed', () => {
    it('should be a function', () => {
      expect(testSubject.setCollectionKeyed).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setCollectionKeyed('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })

  describe('setCollectionIndexed', () => {
    it('should be a function', () => {
      expect(testSubject.setCollectionIndexed).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setCollectionIndexed('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })

  describe('setCollectionSet', () => {
    it('should be a function', () => {
      expect(testSubject.setCollectionSet).toBeFunction()
    })

    it('should set a new immutable object', () => {
      const actual = testSubject.setCollectionSet('dummy', [1, 2, 3, 4, 5])

      expect(actual).toBeInstanceOf(immutable.Seq)
    })
  })
})
