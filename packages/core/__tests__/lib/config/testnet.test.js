const config = require('../../../lib/config/testnet/delegates.json')

describe('Testnet Config', () => {
  it('valid delegates', () => {
    expect(config.dynamicFees).toContainAllKeys([
      'feeMultiplier',
      'minAcceptableFee',
    ])
    expect(config.dynamicFees.feeMultiplier).toBeNumber()
    expect(config.dynamicFees.minAcceptableFee).toBeNumber()
    expect(config.secrets).toBeArrayOfSize(51)
  })
})
