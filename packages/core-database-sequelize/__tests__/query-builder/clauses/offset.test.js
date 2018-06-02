'use strict'

const clause = require('../../../lib/query-builder/clauses/offset')

describe('Clauses - OFFSET', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok', () => {
    expect(clause(10)).toBe(10)
  })
})
