'use strict'

const clause = require('../../../../lib/query-builder/clauses/aggregates/count')

describe('Clauses - Aggregates - COUNT', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  describe('using values', () => {
    it('should be ok without an alias', () => {
      expect(clause('balance')).toEqual(['COUNT ("balance") AS "balance"'])
    })

    it('should be ok with an alias', () => {
      expect(clause('balance', 'dummy-alias')).toEqual(['COUNT ("balance") AS "dummy-alias"'])
    })
  })
})
