'use strict'

let repository

beforeAll(async (done) => {
  await require('../__support__/setup')()

  repository = new (require('../../lib/repositories/transactions'))()

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
