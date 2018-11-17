const config = require('../../../lib/config/testnet.1/delegates.json')

describe('Testnet 1 Config', () => {
  it('valid delegates', () => {
    expect(config.dynamicFees).toContainAllKeys([
      'feeMultiplier',
      'minAcceptableFee',
    ])
    expect(config.dynamicFees.feeMultiplier).toBeNumber()
    expect(config.dynamicFees.minAcceptableFee).toBeNumber()
    expect(config.secrets).toBeArrayOfSize(26)
  })
})
