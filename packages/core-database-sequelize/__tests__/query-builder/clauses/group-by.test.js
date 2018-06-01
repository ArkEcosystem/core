'use strict'

const clause = require('../../../lib/query-builder/clauses/group-by')

describe('Clauses - GROUP BY', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok', () => {
    expect(clause('balance')).toBe('balance')
  })
})
