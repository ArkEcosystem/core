'use strict'

const clause = require('../../../lib/query-builder/clauses/select')

describe('Clauses - SELECT', () => {
  it('should be a function', () => {
    expect(clause).toBeFunction()
  })

  it('should be ok', () => {
    expect(clause(['balance'])).toEqual(['balance'])
  })
})
