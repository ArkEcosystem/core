'use strict'

const clause = require('../../../../lib/query-builder/clauses/where/null')

describe('Clauses - Where - NULL', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok using values', () => {
    expect(clause(['balance'])).toEqual([{
      column: 'balance',
      operator: 'IS NULL'
    }])
  })

  it('should be ok using an array', () => {
    expect(clause([
      ['balance', 'height']
    ])).toEqual([{
      column: 'balance',
      operator: 'IS NULL'
    }, {
      column: 'height',
      operator: 'IS NULL'
    }])
  })
})
