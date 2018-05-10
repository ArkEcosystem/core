'use strict'

const app = require('../__support__/setup')

beforeAll(async (done) => {
  await app.setUp()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('API - Version 1', () => {
  //
})
