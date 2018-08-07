'use strict'

const vote = require('../../lib/commands/vote')

describe('Commands - Vote', () => {
  it('should be a function', () => {
    expect(vote).toBeFunction()
  })
})
