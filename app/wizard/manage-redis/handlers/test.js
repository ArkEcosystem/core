const Redis = require('ioredis')
const onCancel = require('app/wizard/cancel')
const { sleep } = require('sleep')
const utils = require('app/wizard/utils')

module.exports = async () => {
  const client = new Redis(utils.readConfig('server').redis)

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
