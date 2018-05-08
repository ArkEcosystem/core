'use strict'

const app = require('./__support__/setup')

let stateMachine

beforeAll(async (done) => {
  await app.setUp()

  stateMachine = require('../lib/state-machine')

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('State Machine', () => {
  it('should be an object', () => {
    expect(stateMachine).toBeObject()
  })
})
