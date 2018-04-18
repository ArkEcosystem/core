'use strict';

const TransactionRepository = require('../../src/repositories/transactions')
const repository = new TransactionRepository()

describe('Transaction Repository', () => {
  it('should be an object', async () => {
    await expect(repository).toBeObject()
  })

  describe('findAll', async () => {
    it('should be a function', async () => {
      await expect(repository.findAll).toBeFunction()
    })
  })

  describe('findAllByGenerator', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllByGenerator).toBeFunction()
    })
  })

  describe('findById', async () => {
    it('should be a function', async () => {
      await expect(repository.findById).toBeFunction()
    })
  })

  describe('findLastByPublicKey', async () => {
    it('should be a function', async () => {
      await expect(repository.findLastByPublicKey).toBeFunction()
    })
  })

  describe('findAllByDateTimeRange', async () => {
    it('should be a function', async () => {
      await expect(repository.findAllByDateTimeRange).toBeFunction()
    })
  })

  describe('search', async () => {
    it('should be a function', async () => {
      await expect(repository.search).toBeFunction()
    })
  })

  describe('totalsByGenerator', async () => {
    it('should be a function', async () => {
      await expect(repository.totalsByGenerator).toBeFunction()
    })
  })
})
