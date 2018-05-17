'use strict'

const app = require('../../__support__/setup')

let filterItems

beforeAll(async (done) => {
  await app.setUp()

  filterItems = require('../../../lib/repositories/utils/filter-items')

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Filter Items', () => {
  const items = [
    { a: 1, b: 2, c: [] },
    { a: 2, b: 2, c: ['lol'], d: ['persona'] },
    { a: 3, b: 3, c: ['d', 'lol', 'z'] },
    { a: 2, b: 4, c: ['ark'], d: 'persona' },
    { a: 3, b: 4, c: ['LoL'] }
  ]

  describe('exact', () => {
    it('match objects with the same value than the parameter', () => {
      expect(filterItems(items, { a: 1 }, { exact: ['a'] })).toEqual([
        { a: 1, b: 2, c: [] }
      ])
      expect(filterItems(items, { a: 3 }, { exact: ['a'] })).toEqual([
        { a: 3, b: 3, c: ['d', 'lol', 'z'] },
        { a: 3, b: 4, c: ['LoL'] }
      ])
      expect(filterItems(items, { a: 3, b: 3 }, { exact: ['a'] })).toEqual([
        { a: 3, b: 3, c: ['d', 'lol', 'z'] },
        { a: 3, b: 4, c: ['LoL'] }
      ])
      expect(filterItems(items, { a: 3, b: 3 }, { exact: ['a', 'b'] })).toEqual([
        { a: 3, b: 3, c: ['d', 'lol', 'z'] }
      ])
    })
  })

  describe('between', () => {
    it('match objects that include a value beween two parameter', () => {
      expect(filterItems(items, { a: { from: 3 } }, { between: ['a'] })).toEqual([
        { a: 3, b: 3, c: ['d', 'lol', 'z'] },
        { a: 3, b: 4, c: ['LoL'] }
      ])
      expect(filterItems(items, { a: { from: 2, to: 2 } }, { between: ['a'] })).toEqual([
        { a: 2, b: 2, c: ['lol'], d: ['persona'] },
        { a: 2, b: 4, c: ['ark'], d: 'persona' }
      ])
      expect(filterItems(items, { a: { to: 2 } }, { between: ['a'] })).toEqual([
        { a: 1, b: 2, c: [] },
        { a: 2, b: 2, c: ['lol'], d: ['persona'] },
        { a: 2, b: 4, c: ['ark'], d: 'persona' }
      ])
    })
  })

  // This filter is not used yet
  describe('any', () => {
    it('match objects that include some values of the parameters', () => {
      expect(filterItems(items, { c: ['lol'] }, { any: ['c'] })).toEqual([
        { a: 2, b: 2, c: ['lol'], d: ['persona'] },
        { a: 3, b: 3, c: ['d', 'lol', 'z'] }
      ])
      expect(filterItems(items, { c: ['lol'], d: ['persona'] }, { any: ['c'] })).toEqual([
        { a: 2, b: 2, c: ['lol'], d: ['persona'] },
        { a: 3, b: 3, c: ['d', 'lol', 'z'] }
      ])
      expect(filterItems(items, { c: ['lol'], d: ['persona'] }, { any: ['c', 'd'] })).toEqual([
        { a: 2, b: 2, c: ['lol'], d: ['persona'] },
        { a: 3, b: 3, c: ['d', 'lol', 'z'] }
      ])
    })
  })
})
