const app = require('../../__support__/setup')

let filterRows

beforeAll(async done => {
  await app.setUp()

  filterRows = require('../../../lib/repositories/utils/filter-rows')

  done()
})

afterAll(async done => {
  await app.tearDown()

  done()
})

describe('Filter Rows', () => {
  const rows = [
    { a: 1, b: 2, c: [] },
    {
      a: 2, b: 2, c: ['dummy-1'], d: ['dummy-0'],
    },
    { a: 3, b: 3, c: ['dummy-3', 'dummy-1', 'dummy-4'] },
    {
      a: 2, b: 4, c: ['dummy-2'], d: 'dummy-0',
    },
    { a: 3, b: 4, c: ['DUMMY-1'] },
  ]

  describe('exact', () => {
    it('match objects with the same value than the parameter', () => {
      expect(filterRows(rows, { a: 1 }, { exact: ['a'] })).toEqual([
        { a: 1, b: 2, c: [] },
      ])
      expect(filterRows(rows, { a: 3 }, { exact: ['a'] })).toEqual([
        { a: 3, b: 3, c: ['dummy-3', 'dummy-1', 'dummy-4'] },
        { a: 3, b: 4, c: ['DUMMY-1'] },
      ])
      expect(filterRows(rows, { a: 3, b: 3 }, { exact: ['a'] })).toEqual([
        { a: 3, b: 3, c: ['dummy-3', 'dummy-1', 'dummy-4'] },
        { a: 3, b: 4, c: ['DUMMY-1'] },
      ])
      expect(filterRows(rows, { a: 3, b: 3 }, { exact: ['a', 'b'] })).toEqual([
        { a: 3, b: 3, c: ['dummy-3', 'dummy-1', 'dummy-4'] },
      ])
    })
  })

  describe('between', () => {
    it('match objects that include a value beween two parameters (included)', () => {
      expect(filterRows(rows, { a: { from: 3 } }, { between: ['a'] })).toEqual([
        { a: 3, b: 3, c: ['dummy-3', 'dummy-1', 'dummy-4'] },
        { a: 3, b: 4, c: ['DUMMY-1'] },
      ])
      expect(
        filterRows(rows, { a: { from: 2, to: 2 } }, { between: ['a'] }),
      ).toEqual([
        {
          a: 2, b: 2, c: ['dummy-1'], d: ['dummy-0'],
        },
        {
          a: 2, b: 4, c: ['dummy-2'], d: 'dummy-0',
        },
      ])
      expect(filterRows(rows, { a: { to: 2 } }, { between: ['a'] })).toEqual([
        { a: 1, b: 2, c: [] },
        {
          a: 2, b: 2, c: ['dummy-1'], d: ['dummy-0'],
        },
        {
          a: 2, b: 4, c: ['dummy-2'], d: 'dummy-0',
        },
      ])
      expect(
        filterRows(rows, { b: { from: 3, to: 4 } }, { between: ['b'] }),
      ).toEqual([
        { a: 3, b: 3, c: ['dummy-3', 'dummy-1', 'dummy-4'] },
        {
          a: 2, b: 4, c: ['dummy-2'], d: 'dummy-0',
        },
        { a: 3, b: 4, c: ['DUMMY-1'] },
      ])
    })
  })

  // This filter is not used yet
  describe('any', () => {
    it('match objects that include some values of the parameters', () => {
      expect(filterRows(rows, { c: ['dummy-1'] }, { any: ['c'] })).toEqual([
        {
          a: 2, b: 2, c: ['dummy-1'], d: ['dummy-0'],
        },
        { a: 3, b: 3, c: ['dummy-3', 'dummy-1', 'dummy-4'] },
      ])
      expect(
        filterRows(rows, { c: ['dummy-1'], d: ['dummy-0'] }, { any: ['c'] }),
      ).toEqual([
        {
          a: 2, b: 2, c: ['dummy-1'], d: ['dummy-0'],
        },
        { a: 3, b: 3, c: ['dummy-3', 'dummy-1', 'dummy-4'] },
      ])
      expect(
        filterRows(
          rows,
          { c: ['dummy-1'], d: ['dummy-0'] },
          { any: ['c', 'd'] },
        ),
      ).toEqual([
        {
          a: 2, b: 2, c: ['dummy-1'], d: ['dummy-0'],
        },
        { a: 3, b: 3, c: ['dummy-3', 'dummy-1', 'dummy-4'] },
      ])
    })
  })
})
