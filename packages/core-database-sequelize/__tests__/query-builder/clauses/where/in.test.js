'use strict'

const clause = require('../../../../lib/query-builder/clauses/where/in')

describe('Clauses - Where - IN', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok using values', () => {
    expect(clause(['balance', 123])).toEqual([{
      column: 'balance',
      operator: 'IN',
      value: 123
    }])
  })

  it('should be ok using an object', () => {
    expect(clause([{
      balance: 123,
      height: 456
    }])).toEqual([{
      column: 'balance',
      operator: 'IN',
      value: 123
    }, {
      column: 'height',
      operator: 'IN',
      value: 456
    }])
  })
})
