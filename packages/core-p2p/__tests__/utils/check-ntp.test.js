'use strict'

const app = require('../__support__/setup')

let checker

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  checker = require('../../lib/utils/check-ntp')
})

describe('Check NTP', () => {
  it('should be a function', () => {
    expect(checker).toBeFunction()
  })

  it('should be ok', async () => {
    const response = await checker(['time.google.com'])

    expect(response).toBeObject()
  })
})
