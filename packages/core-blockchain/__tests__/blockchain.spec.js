'use strict'

const Blockchain = require('../lib/manager')

describe('Core | Blockchain', () => {
  it('exists', () => {
    expect(Blockchain).toBeFunction()
  })

  it('works with sinons', () => {
      const fn = jest.fn()

      expect(fn).toBeFunction()

      fn('Hello World')

      expect(fn).toHaveBeenCalledWith('Hello World')
  })
})
