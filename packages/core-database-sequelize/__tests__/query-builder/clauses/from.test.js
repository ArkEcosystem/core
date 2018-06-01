'use strict'

const clause = require('../../../lib/query-builder/clauses/from')

describe('Clauses - FROM', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok', () => {
    expect(clause('wallets')).toBe('wallets')
  })
})
