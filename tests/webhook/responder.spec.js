require('./server')

const axios = require('axios')
const crypto = require('crypto')

const hookToken = crypto.createHash('md5').update('ark-rest-hooks').digest('hex')

describe('REST Hooks', () => {
  it('should respond with 200 with valid event and token', async () => {
    await axios
      .post(
        'http://localhost:5555/',
        { event: 'block:forged' },
        { headers: { 'X-Hook-Token': hookToken }
      })
      .then(response => expect(response.status).toBe(200))
  })

  it('should respond with 400 with invalid event', async () => {
    await axios
      .post(
        'http://localhost:5555/',
        { event: 'invalid:event' },
        { headers: { 'X-Hook-Token': hookToken }
      })
      .catch(error => expect(error.response.status).toBe(400))
  })

  it('should respond with 401 with invalid token', async () => {
    await axios
      .post(
        'http://localhost:5555/',
        { event: 'block:forged' },
        { headers: { 'X-Hook-Token': 'invalid token' }
      })
      .catch(error => expect(error.response.status).toBe(401))
  })
})
