require('./server')

const axios = require('axios')
const crypto = require('crypto')
const fixture = require('./fixture')

describe('REST Hooks', () => {
  it('should respond with 200 with valid event and token', async () => {
    const response = await axios.post(
      'http://localhost:5555/',
      { event: 'block:forged' },
      { headers: { 'X-Hook-Token': fixture.server }
    })

    await expect(response.status).toBe(200)
  })

  it('should respond with 400 with invalid event', async () => {
    try {
      await axios.post(
        'http://localhost:5555/',
        { event: 'invalid:event' },
        { headers: { 'X-Hook-Token': fixture.server }
      })
    } catch (error) {
      await expect(error.response.status).toBe(400)
    }
  })

  it('should respond with 401 with invalid token', async () => {
    try {
      await axios.post(
        'http://localhost:5555/',
        { event: 'block:forged' },
        { headers: { 'X-Hook-Token': 'invalid token' }
      })
    } catch (error) {
      await expect(error.response.status).toBe(401)
    }
  })
})
