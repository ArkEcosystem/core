'use strict'

require('../../__support__/setup')

const utils = require('../utils')

const peerIp = '167.114.29.32'

describe('API 2.0 - Peers', () => {
  describe('GET /peers', () => {
    it('should GET all the peers', async () => {
      const response = await utils.request('GET', 'peers')
      utils.expectSuccessful(response)
      utils.expectCollection(response)

      expect(response.data.data[0]).toBeObject()
    })
  })

  describe('GET /peers/:ip', () => {
    it('should GET a peer by the given ip', async () => {
      const response = await utils.request('GET', `peers/${peerIp}`)
      utils.expectSuccessful(response)
      utils.expectResource(response)

      expect(response.data.data).toBeObject()
    })
  })
})
