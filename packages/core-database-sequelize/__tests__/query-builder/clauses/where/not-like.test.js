'use strict'

const clause = require('../../../../lib/query-builder/clauses/where/not-like')

describe('Clauses - Where - NOT LIKE', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok using values', () => {
    expect(clause(['balance', 123])).toEqual([{
      column: 'balance',
      operator: 'NOT LIKE',
      value: '%123%'
    }])
  })

  it('should be ok using values', () => {
    expect(clause([{
      balance: 123,
      height: 456
    }])).toEqual([{
      column: 'balance',
      operator: 'NOT LIKE',
      value: '%123%'
    }, {
      column: 'height',
      operator: 'NOT LIKE',
      value: '%456%'
    }])
  })
})
