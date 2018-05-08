'use strict'

const app = require('../__support__/setup')

let repository

beforeAll(async (done) => {
  await app.setUp()

  repository = new (require('../../lib/repositories/delegates'))()

  done()
})

// afterAll(async (done) => {
//   await app.tearDown()

//   done()
// })

describe('Delegate Repository', () => {
  it('should be an object', async () => {
    await expect(repository).toBeObject()
  })

  describe('findAll', async () => {
    it('should be a function', async () => {
      await expect(repository.findAll).toBeFunction()
    })
  })

  describe('paginate', async () => {
    it('should be a function', async () => {
      await expect(repository.paginate).toBeFunction()
    })
  })

  describe('search', async () => {
    it('should be a function', async () => {
      await expect(repository.search).toBeFunction()
    })
  })

  describe('findById', async () => {
    it('should be a function', async () => {
      await expect(repository.findById).toBeFunction()
    })
  })

  describe('active', async () => {
    it('should be a function', async () => {
      await expect(repository.active).toBeFunction()
    })
  })
})
