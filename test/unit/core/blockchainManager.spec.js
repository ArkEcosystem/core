const { expect } = require('chai')
const sinon = require('sinon')

const BlockchainManager = require('core/blockchainManager')

describe('Core | BlockchainManager', ()=> {
  it('exists', function() {
    expect(BlockchainManager).to.be
  })

  it('works with sinons', function() {
    const spy = sinon.spy()
    spy()
    expect(spy).to.have.been.called
  })
})
