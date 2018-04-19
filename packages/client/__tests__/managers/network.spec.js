import NetworkManager from '@/managers/network'
import networkMainnet from '@/networks/ark/mainnet'

describe('Network Manager', () => {
  it('should be instantiated', () => {
    expect(NetworkManager).toBeDefined()
  })

  it('should find mainnet by name', () => {
    const mainnet = NetworkManager.findByName('mainnet')
    expect(mainnet).toMatchObject(networkMainnet)
  })
})
