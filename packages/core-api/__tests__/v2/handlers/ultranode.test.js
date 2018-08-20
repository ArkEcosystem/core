'use strict'

require('../../__support__/setup')

const utils = require('../utils')
const genesisBlock = require('../../__support__/config/genesisBlock.json')

describe('API 2.0 - Blocks', () => {
  describe('GET /ultranodes', () => {
    it('should GET all the blocks', async () => {
      const response = await utils.request('GET', 'blocks')
      utils.expectSuccessful(response)
      utils.expectCollection(response)
      utils.expectPaginator(response)

      const block = response.data.data[0]
      utils.expectBlock(block)
    })
  })
})
