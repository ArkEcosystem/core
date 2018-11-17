const config = require('../../../lib/config/testnet.live/delegates.json')

describe('Testnet Live Config', () => {
  it('valid delegates', () => {
    expect(config.dynamicFees).toContainAllKeys([
      'feeMultiplier',
      'minAcceptableFee',
    ])
    expect(config.dynamicFees.feeMultiplier).toBeNumber()
    expect(config.dynamicFees.minAcceptableFee).toBeNumber()
    expect(config.secrets).toBeArrayOfSize(0)
  })
})
