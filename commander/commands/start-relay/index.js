const path = require('path')
const { startProcess } = require('../../utils')
const { sleep } = require('sleep')
const { onCancel } = require('../../utils')

module.exports = async () => {
  startProcess({
    name: 'ark-core:relay',
    script: path.resolve(__dirname, '../../../app/start-relay.js'),
    args: [
      '--config', process.env.ARK_CONFIG
    ]
  }, () => {
    console.log('The relay node has been started.')

    sleep(1)

    onCancel()
  })
}
