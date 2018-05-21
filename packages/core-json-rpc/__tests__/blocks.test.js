const request = require('./__support__/request')

require('./__support__/setup')

describe('Blocks', () => {
  describe('GET /mainnet/blocks/latest', () => {
    it('should get the latest block', async () => {
      const response = await request('blocks.latest')

      await expect(response.data.result.id).toBeString()
    })
  })

  describe('GET /mainnet/blocks/{id}', () => {
    it('should get the block information', async () => {
      const response = await request('blocks.info', {
        id: '4366553906931540162'
      })

      await expect(response.data.result.id).toBe('4366553906931540162')
    })
  })

  describe('GET /mainnet/blocks/{id}/transactions', () => {
    it('should get the block transactions', async () => {
      const response = await request('blocks.transactions', {
        id: '4366553906931540162'
      })

      await expect(response.data.result.transactions).toHaveLength(50)
    })
  })
})
