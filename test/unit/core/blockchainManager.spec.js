const { expect } = require('chai')
const sinon = require('sinon')

const BlockchainManager = require('core/blockchainManager')

describe('Core | BlockchainManager', () => {
  it('exists', () => {
    expect(BlockchainManager).to.be.a('function')
  })

  it('works with sinons', () => {
    const spy = sinon.spy()
    spy()
    expect(spy).to.have.been.called()
  })
})
