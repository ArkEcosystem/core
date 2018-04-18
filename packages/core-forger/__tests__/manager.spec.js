'use strict';

const ForgerManager = require('../src/manager')
const { Delegate } = require('@arkecosystem/client').models

describe('Core | ForgerManager', () => {
  const config = {
    server: { version: '0.0.1', port: 9999 },
    network: { nethash: 'lol-hash' }
  }

  const delegateConfig = {
    ...{ delegates: { secrets: ['do-not-tell-anyone'] } },
    ...config
  }

  describe('loadDelegates', () => {
    it('returns a promise', async () => {
      const forger = new ForgerManager(config)
      try {
        const promise = await forger.loadDelegates()
        expect(promise).toBeInstanceOf(Promise)
      } catch (error) {
        //
      }
    })

    describe('without configured delegates', () => {
      it('rejects with an Error', () => {
        const forger = new ForgerManager(config)

        try {
          forger.loadDelegates()
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toMatch(/no delegate/i)
        }
      })
    })
    describe('with configured delegates', () => {
      it('resolves with them', async () => {
        const forger = new ForgerManager(delegateConfig)

        try {
          const delegates = await forger.loadDelegates()

          await expect(delegates).toBeType('array')

          delegates.forEach(delegate => expect(delegate).toBeInstanceOf(Delegate))
        } catch (error) {
          console.error(error)
        }
      })
    })
  })

  describe('startForging', () => {})

  describe('broadcast', () => {})

  describe('pickForgingDelegate', () => {
    it('returns a promise', async () => {
      const forger = new ForgerManager(delegateConfig)
      await forger.loadDelegates()

      try {
        const promise = await forger.pickForgingDelegate({ delegate: {} })
        expect(promise).toBeInstanceOf(Promise)
      } catch (error) {
      }
    })
  })

  describe('getRound', () => {})
})
