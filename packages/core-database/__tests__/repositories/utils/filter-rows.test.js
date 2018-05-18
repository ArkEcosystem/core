'use strict'

const app = require('../../__support__/setup')

let filterRows

beforeAll(async (done) => {
  await app.setUp()

  filterRows = require('../../../lib/repositories/utils/filter-rows')

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Filter Rows', () => {
  const rows = [
    { a: 1, b: 2, c: [] },
    { a: 2, b: 2, c: ['lol'], d: ['persona'] },
    { a: 3, b: 3, c: ['d', 'lol', 'z'] },
    { a: 2, b: 4, c: ['ark'], d: 'persona' },
    { a: 3, b: 4, c: ['LoL'] }
  ]

  describe('exact', () => {
    it('match objects with the same value than the parameter', () => {
      expect(filterRows(rows, { a: 1 }, { exact: ['a'] })).toEqual([
        { a: 1, b: 2, c: [] }
      ])
      expect(filterRows(rows, { a: 3 }, { exact: ['a'] })).toEqual([
        { a: 3, b: 3, c: ['d', 'lol', 'z'] },
        { a: 3, b: 4, c: ['LoL'] }
      ])
      expect(filterRows(rows, { a: 3, b: 3 }, { exact: ['a'] })).toEqual([
        { a: 3, b: 3, c: ['d', 'lol', 'z'] },
        { a: 3, b: 4, c: ['LoL'] }
      ])
      expect(filterRows(rows, { a: 3, b: 3 }, { exact: ['a', 'b'] })).toEqual([
        { a: 3, b: 3, c: ['d', 'lol', 'z'] }
      ])
    })
  })

  describe('between', () => {
    it('match objects that include a value beween two parameter', () => {
      expect(filterRows(rows, { a: { from: 3 } }, { between: ['a'] })).toEqual([
        { a: 3, b: 3, c: ['d', 'lol', 'z'] },
        { a: 3, b: 4, c: ['LoL'] }
      ])
      expect(filterRows(rows, { a: { from: 2, to: 2 } }, { between: ['a'] })).toEqual([
        { a: 2, b: 2, c: ['lol'], d: ['persona'] },
        { a: 2, b: 4, c: ['ark'], d: 'persona' }
      ])
      expect(filterRows(rows, { a: { to: 2 } }, { between: ['a'] })).toEqual([
        { a: 1, b: 2, c: [] },
        { a: 2, b: 2, c: ['lol'], d: ['persona'] },
        { a: 2, b: 4, c: ['ark'], d: 'persona' }
      ])
    })
  })

  // This filter is not used yet
  describe('any', () => {
    it('match objects that include some values of the parameters', () => {
      expect(filterRows(rows, { c: ['lol'] }, { any: ['c'] })).toEqual([
        { a: 2, b: 2, c: ['lol'], d: ['persona'] },
        { a: 3, b: 3, c: ['d', 'lol', 'z'] }
      ])
      expect(filterRows(rows, { c: ['lol'], d: ['persona'] }, { any: ['c'] })).toEqual([
        { a: 2, b: 2, c: ['lol'], d: ['persona'] },
        { a: 3, b: 3, c: ['d', 'lol', 'z'] }
      ])
      expect(filterRows(rows, { c: ['lol'], d: ['persona'] }, { any: ['c', 'd'] })).toEqual([
        { a: 2, b: 2, c: ['lol'], d: ['persona'] },
        { a: 3, b: 3, c: ['d', 'lol', 'z'] }
      ])
    })
  })
})
