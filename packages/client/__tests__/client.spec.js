import ark from '../src/client'
import ApiClient from '../src/api'

describe('Client', () => {
  it('should be instantiated', () => {
    expect(ark).toBeObject()
  })

  it('returns an api client', () => {
    const client = ark.getClient('https://localhost:4003')

    expect(client).toBeInstanceOf(ApiClient)
  })
})
