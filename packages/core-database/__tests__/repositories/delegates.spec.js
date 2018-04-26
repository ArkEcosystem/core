'use strict';

let repository

beforeAll(async (done) => {
  await require('../__support__/setup')()

  repository = new (require('../../lib/repositories/delegates'))()

  done()
})

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
