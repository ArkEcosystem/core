'use strict'

const stateMachine = require('../lib/blockchain')

describe('State Machine', () => {
  it('should be an object', () => {
    expect(stateMachine).toBeObject()
  })
})
