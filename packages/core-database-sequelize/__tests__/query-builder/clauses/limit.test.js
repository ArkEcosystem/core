'use strict'

const clause = require('../../../lib/query-builder/clauses/limit')

describe('Clauses - LIMIT', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok', () => {
    expect(clause(10)).toBe(10)
  })
})
