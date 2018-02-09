const express = require('express')
const crypto = require('crypto')

const server = express()

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const hookToken = crypto.createHash('md5').update('ark-rest-hooks').digest('hex')

beforeAll(() => {
  server.post('/', jsonParser, (req, res) => {
    if (req.headers['x-hook-token'] !== hookToken) {
      return res.status(401).send('Unauthorized!')
    }

    if (req.body.event !== 'block:forged') {
      return res.status(400).send('Bad Request!')
    }

    return res.status(200).send('Hello World!')
  })

  server.listen(5555, () => console.log('Server listening on port 5555!'))
})

afterAll(() => server.close())

module.exports = server
