const sinon = require('sinon')
const BlockchainManager = require('core/blockchainManager')

describe('Core | BlockchainManager', () => {
  it('exists', () => {
    BlockchainManager.should.be.a('function')
  })

  it('works with sinons', () => {
      const spy = sinon.spy();

      spy('Hello World')

      spy.should.be.a('function')

      spy.should.have.been.calledWith('Hello World')
  })
})
