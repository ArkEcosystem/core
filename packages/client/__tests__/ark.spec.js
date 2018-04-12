import Ark from '../src'
import ApiClient from '../src/api'
import network from '../src/networks/ark/devnet.json'

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
