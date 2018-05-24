'use strict'

const app = require('./__support__/setup')

const { Delegate } = require('@arkecosystem/crypto').models

let manager

beforeAll(async (done) => {
  await app.setUp()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(() => {
  const ForgeManager = require('../lib/manager')
  manager = new ForgeManager(require('../lib/defaults'))
})

jest.setTimeout(30000)

describe('Forger Manager', () => {
  describe('loadDelegates', () => {
    it('should be a function', () => {
      expect(manager.loadDelegates).toBeFunction()
    })

    it('should throw an error without configured delegates', async () => {
      manager.secrets = null
      await expect(manager.loadDelegates()).rejects.toThrowError('No delegate found')
    })

    it('should be ok with configured delegates', async () => {
      const delegates = await manager.loadDelegates()

      expect(delegates).toBeArray()

      delegates.forEach(delegate => expect(delegate).toBeInstanceOf(Delegate))
    })
  })

  describe('startForging', () => {
    it('should be a function', () => {
      expect(manager.startForging).toBeFunction()
    })
  })

  describe('__monitor', () => {
    it('should be a function', () => {
      expect(manager.__monitor).toBeFunction()
    })
  })

  describe('__pickForgingDelegate', () => {
    it('should be a function', () => {
      expect(manager.__pickForgingDelegate).toBeFunction()
    })

    it('should be ok', async () => {
      manager.delegates = [{
        username: 'arkxdev',
        publicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0'
      }]

      const delegate = await manager.__pickForgingDelegate({
        delegate: {
          publicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0'
        }
      })

      expect(delegate).toBeObject()
      expect(delegate.username).toBe('arkxdev')
      expect(delegate.publicKey).toBe('0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0')
    })
  })
})
