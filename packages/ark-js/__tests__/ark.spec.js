import Ark from '@/'
import ApiClient from '@/api'
import network from '@/networks/ark/devnet'

let ark
beforeEach(() => (ark = new Ark(network)))

describe('Ark', () => {
  it('should be instantiated', () => {
    expect(ark).toBeInstanceOf(Ark)
  })

  it('returns an api client', () => {
    const client = ark.getClient('https://localhost:4003')

    expect(client).toBeInstanceOf(ApiClient)
  })
})
