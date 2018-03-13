const Redis = require('ioredis')
const config = require(`config/${process.env.NETWORK}/server.json`)
const onCancel = require('../../cancel')
const { sleep } = require('sleep')

module.exports = async () => {
  const client = new Redis(config.redis)

  client.on('connect', () => {
    console.log('Redis connection established.')

    sleep(1)

    onCancel()
  }).on('error', (error) => {
    console.log('Redis connection not established.')
    console.log(error.message)

    sleep(3)

    onCancel()
  })
}
