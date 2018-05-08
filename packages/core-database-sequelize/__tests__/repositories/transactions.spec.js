'use strict'

const app = require('./__support__/setup')

let repository

beforeAll(async (done) => {
  await app.setUp()

  repository = new (require('../../lib/repositories/transactions'))()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Transaction Repository', () => {
  it('should be an object', async () => {
    console.log(repository)
    await expect(repository).toBeObject()
  })

  describe('findAll', async () => {
    it('should be a function', async () => {
      await expect(repository.findAll).toBeFunction()
    })
  })

  describe('findAllByWallet', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllByWallet).toBeFunction()
    })
  })

  describe('findAllBySender', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllBySender).toBeFunction()
    })
  })

  describe('findAllByRecipient', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllByRecipient).toBeFunction()
    })
  })

  describe('allVotesBySender', async () => {
    it('should be a function', async () => {
      await expect(repository.allVotesBySender).toBeFunction()
    })
  })

  describe('findAllByBlock', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllByBlock).toBeFunction()
    })
  })

  describe('findAllByType', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllByType).toBeFunction()
    })
  })

  describe('findById', async () => {
    it('should be a function', async () => {
      await expect(repository.findById).toBeFunction()
    })
  })

  describe('findByTypeAndId', async () => {
    it('should be a function', async () => {
      await expect(repository.findByTypeAndId).toBeFunction()
    })
  })

  describe('findAllByDateAndType', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllByDateAndType).toBeFunction()
    })
  })

  describe('search', async () => {
    it('should be a function', async () => {
      await expect(repository.search).toBeFunction()
    })
  })
})
