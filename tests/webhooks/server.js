const express = require('express')
const crypto = require('crypto')

const server = express()

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const fixture = require('./fixture')

beforeAll(() => {
  server.post('/', jsonParser, (req, res) => {
    const fullToken = req.headers['x-hook-token'] + fixture.client

    if (fullToken !== fixture.token) {
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
