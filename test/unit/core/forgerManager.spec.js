const { expect } = require('chai')

const ForgerManager = require('core/forgerManager')
const Delegate = require('model/delegate')

describe('Core | ForgerManager', () => {
  const config = {
    server: { version: '0.0.1', port: 9999 },
    network: { nethash: 'lol-hash' }
  }
  const delegateConfig = Object.assign({
    delegates: { secrets: ['do-not-tell-anyone'] }
  }, config)

  describe('loadDelegates', () => {
    it('returns a promise', () => {
      const forger = new ForgerManager(config)
      const promise = forger.loadDelegates()
      // Avoids the UnhandledPromiseRejectionWarning
      promise.catch(() => {})
      expect(promise).to.be.a('promise')
    })

    context('without configured delegates', () => {
      it('rejects with an Error', () => {
        const forger = new ForgerManager(config)
        return forger.loadDelegates()
          .catch(error => {
            expect(error).to.be.an('error')
            expect(error.message).to.match(/no delegate/i)
          })
      })
    })
    context('with configured delegates', () => {
      it('resolves with them', () => {
        const forger = new ForgerManager(delegateConfig)
        return forger.loadDelegates()
          .catch(error => console.error(error))
          .then(delegates => {
            expect(delegates).to.be.an('array')
            delegates.forEach(delegate => {
              expect(delegate).to.be.an.instanceof(Delegate)
            })
          })
      })
    })
  })

  describe('startForging', () => {
  })

  describe('broadcast', () => {
  })

  describe('pickForgingDelegate', () => {
    it('returns a promise', () => {
      const forger = new ForgerManager(delegateConfig)
      forger.loadDelegates()
      const promise = forger.pickForgingDelegate({ delegate: {} })
      expect(promise).to.be.a('promise')
    })
  })

  describe('getRound', () => {
  })
})
