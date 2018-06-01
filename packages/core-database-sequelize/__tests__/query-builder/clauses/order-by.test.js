'use strict'

const clause = require('../../../lib/query-builder/clauses/order-by')

describe('Clauses - ORDER BY', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok with string', () => {
    expect(clause(['balance', 'desc'])).toEqual([{
      column: 'balance',
      direction: 'desc'
    }])
  })

  it('should be ok with object', () => {
    expect(clause([{
      id: 'asc',
      balance: 'desc'
    }])).toEqual([{
      column: 'id',
      direction: 'asc'
    }, {
      column: 'balance',
      direction: 'desc'
    }])
  })
})
