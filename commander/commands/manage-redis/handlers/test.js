const Redis = require('ioredis')
const { onCancel, readConfig } = require('commander/utils')
const { sleep } = require('sleep')

module.exports = async () => {
  const client = new Redis(readConfig('server').redis)

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
