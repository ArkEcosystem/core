const { IPFS } = require('@arkecosystem/client').constants

expect.extend({
  toBeIpfsType: require('../../../../lib/matchers/transactions/types/ipfs')
})

describe('.toBeIpfsType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: IPFS }).toBeIpfsType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeIpfsType()
  })
})
