const { SECOND_SIGNATURE } = require('@arkecosystem/crypto').constants

require('../../../../lib/matchers/transactions/types/second-signature')

describe('.toBeSecondSignatureType', () => {
  test('passes when given a valid transaction', () => {
    expect({ type: SECOND_SIGNATURE }).toBeSecondSignatureType()
  })

  test('fails when given an invalid transaction', () => {
    expect({ type: 'invalid' }).not.toBeSecondSignatureType()
  })
})
