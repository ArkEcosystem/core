'use strict'

const clause = require('../../../../lib/query-builder/clauses/aggregates/max')

describe('Clauses - Aggregates - MAX', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  describe('using values', () => {
    it('should be ok without an alias', () => {
      expect(clause('balance')).toEqual(['MAX ("balance") AS "balance"'])
    })

    it('should be ok with an alias', () => {
      expect(clause('balance', 'dummy-alias')).toEqual(['MAX ("balance") AS "dummy-alias"'])
    })
  })
})
