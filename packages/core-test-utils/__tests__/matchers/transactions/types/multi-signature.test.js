const { MULTI_SIGNATURE } = require('@phantomchain/crypto').constants

require('../../../../lib/matchers/transactions/types/multi-signature')

describe('.toBeMultiSignatureType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: MULTI_SIGNATURE }).toBeMultiSignatureType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeMultiSignatureType()
  })
})
