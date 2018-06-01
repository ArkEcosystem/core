'use strict'

const clause = require('../../../../lib/query-builder/clauses/where/not-between')

describe('Clauses - Where - NOT BETWEEN', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok using values', () => {
    expect(clause(['balance', 123, 456])).toEqual([{
      column: 'balance',
      from: 123,
      operator: 'NOT BETWEEN',
      to: 456
    }])
  })

  it('should be ok using an object', () => {
    expect(clause([
      ['balance', 123, 456],
      ['height', 123, 456]
    ])).toEqual([{
      column: 'balance',
      from: 123,
      operator: 'NOT BETWEEN',
      to: 456
    }, {
      column: 'height',
      from: 123,
      operator: 'NOT BETWEEN',
      to: 456
    }])
  })
})
