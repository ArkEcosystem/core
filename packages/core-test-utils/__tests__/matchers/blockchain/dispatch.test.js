require('../../../lib/matchers/blockchain/dispatch')

describe('.toDispatch', () => {
  const blockchain = {
    dispatch (event) {
      return event
    }
  }

  test('passes when the dispatch method is called with the argument', () => {
    expect(() => blockchain.dispatch('EVENT')).toDispatch(blockchain, 'EVENT')
  })

  test('fails when the dispatch method is not called with the argument', () => {
    expect(() => {}).not.toDispatch(blockchain, 'FAKE-EVENT')
    expect(() => blockchain.dispatch('OTHER-EVENT')).not.toDispatch(blockchain, 'EVENT')
  })
})
