const config = require('../../../lib/config/testnet.2/delegates.json')

describe('Testnet 2 Config', () => {
  it('valid delegates', () => {
    expect(config.dynamicFees).toContainAllKeys([
      'feeMultiplier',
      'minAcceptableFee',
    ])
    expect(config.dynamicFees.feeMultiplier).toBeNumber()
    expect(config.dynamicFees.minAcceptableFee).toBeNumber()
    expect(config.secrets).toBeArrayOfSize(25)
  })
})
