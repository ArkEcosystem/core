import ark from '../../../../lib/client'
import ApiResource from '../../../../lib/api/resources/v2/votes'
require('../../mocks/v2')

let resource

beforeEach(() => {
  resource = ark.getClient('https://localhost:4003/api/').setVersion(2).resource('votes')
})

describe('API - 2.0 - Resources - Voters', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all()
    await expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')
    await expect(response.status).toBe(200)
  })
})
