'use strict';

const BlockchainManager = require('../lib/manager')

describe('Core | BlockchainManager', () => {
  it('exists', () => {
    expect(BlockchainManager).toBeFunction()
  })

  it('works with sinons', () => {
      const fn = jest.fn()

      expect(fn).toBeFunction()

      fn('Hello World')

      expect(fn).toHaveBeenCalledWith('Hello World')
  })
})
