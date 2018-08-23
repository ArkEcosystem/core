const NetworkManager = require('../../lib/managers/network')
const networkMainnet = require('../../lib/networks/phantom/mainnet.json')

describe('Network Manager', () => {
  it('should be instantiated', () => {
    expect(NetworkManager).toBeDefined()
  })

  it('should find mainnet by name', () => {
    const mainnet = NetworkManager.findByName('mainnet')
    expect(mainnet).toMatchObject(networkMainnet)
  })
})
