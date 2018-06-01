'use strict'

const clause = require('../../../../lib/query-builder/clauses/where/not-null')

describe('Clauses - Where - NOT NULL', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok using values', () => {
    expect(clause(['balance'])).toEqual([{
      column: 'balance',
      operator: 'IS NOT NULL'
    }])
  })

  it('should be ok using an array', () => {
    expect(clause([
      ['balance', 'height']
    ])).toEqual([{
      column: 'balance',
      operator: 'IS NOT NULL'
    }, {
      column: 'height',
      operator: 'IS NOT NULL'
    }])
  })
})
