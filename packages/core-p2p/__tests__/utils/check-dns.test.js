'use strict'

const app = require('../__support__/setup')

let checker

beforeAll(async (done) => {
  await app.setUp()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(() => {
  checker = require('../../lib/utils/check-dns')
})

describe('Check DNS', () => {
  it('should be a function', () => {
    expect(checker).toBeFunction()
  })

  it('should be ok', async () => {
    const response = await checker(['1.1.1.1'])

    expect(response).toBe('1.1.1.1')
  })
})
