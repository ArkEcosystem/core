'use strict';

const BlockchainManager = require('../../../lib/managers/blockchain')

describe('Core | BlockchainManager', () => {
  it('exists', () => {
    expect(BlockchainManager).toBeFunction()
  })

  it('works with sinons', () => {
      const f = jest.fn()

      expect(f).toBeFunction()

      f('Hello World')

      expect(f).toHaveBeenCalledWith('Hello World')
  })
})
