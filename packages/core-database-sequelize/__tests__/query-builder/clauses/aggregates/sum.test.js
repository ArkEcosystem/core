'use strict'

const clause = require('../../../../lib/query-builder/clauses/aggregates/sum')

describe('Clauses - Aggregates - SUM', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  describe('using values', () => {
    it('should be ok without an alias', () => {
      expect(clause('balance')).toEqual(['SUM ("balance") AS "balance"'])
    })

    it('should be ok with an alias', () => {
      expect(clause('balance', 'dummy-alias')).toEqual(['SUM ("balance") AS "dummy-alias"'])
    })
  })
})
