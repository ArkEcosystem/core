const BlockchainManager = require('app/core/managers/blockchain')

describe('Core | BlockchainManager', () => {
  it('exists', () => {
    expect(BlockchainManager).toBeType('function')
  })

  it('works with sinons', () => {
      const f = jest.fn()

      expect(f).toBeType('function')

      f('Hello World')

      expect(f).toHaveBeenCalledWith('Hello World')
  })
})
