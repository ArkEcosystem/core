require('../__support__/mocks/core-container') // before all so that the mock is used
const axios = require('axios')
const createServer = require('../../lib/server/create')
const mountServer = require('../../lib/server/mount')
const contentType = require('../../lib/plugins/content-type')

let server
beforeAll(async () => {
  server = await createServer({
    host: '0.0.0.0',
    port: 3000,
  })

  await server.register({ plugin: contentType })

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => 'Hello!',
  })

  await mountServer('Dummy', server)
})

afterAll(async () => {
  await server.stop()
})

describe('Plugins - Content-Type', () => {
  describe('GET /', () => {
    it('should return code 200', async () => {
      const response = await axios.get('http://0.0.0.0:3000/', {
        headers: { 'Content-Type': 'application/json' },
      })

      expect(response.status).toBe(200)
    })

    it('should return code 415', async () => {
      try {
        await axios.get('http://0.0.0.0:3000/', {
          headers: { 'Content-Type': 'application/text' },
        })
      } catch (e) {
        expect(e.response.status).toBe(415)
      }
    })
  })
})
