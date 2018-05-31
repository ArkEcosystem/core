'use strict'

const map = require('../../../../../lib/query-builder/clauses/where/utils/map')

describe('Clauses - Where - Utils - map', () => {
  it('should be an object', () => {
    expect(map).toBeFunction()
  })

  it('should be ok', () => {
    expect(true).toBeTruthy()
  })
})
