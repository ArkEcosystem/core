'use strict'

const escape = require('../../../lib/query-builder/utils/escape')

describe('Utils - escape', () => {
  it('should be an object', () => {
    expect(escape).toBeFunction()
  })

  it('should be ok with strings', () => {
    expect(escape('test string')).toBe('"test string"')
  })

  it('should be ok with numbers', () => {
    expect(escape('123')).toBe('\'123\'')
  })
})
