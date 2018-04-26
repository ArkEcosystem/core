'use strict';

let repository

beforeAll(async (done) => {
  await require('../__support__/setup')()

  repository = new (require('../../lib/repositories/wallets'))()

  done()
})

describe('Wallet Repository', () => {
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

  describe('findAllByVote', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllByVote).toBeFunction()
    })
  })

  describe('findById', async () => {
    it('should be a function', async () => {
      await expect(repository.findById).toBeFunction()
    })
  })

  describe('count', async () => {
    it('should be a function', async () => {
      await expect(repository.count).toBeFunction()
    })
  })

  describe('top', async () => {
    it('should be a function', async () => {
      await expect(repository.top).toBeFunction()
    })
  })

  describe('search', async () => {
    it('should be a function', async () => {
      await expect(repository.search).toBeFunction()
    })
  })
})
