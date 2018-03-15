const path = require('path')
const { startProcess } = require('../../utils')

module.exports = async () => {
  startProcess({
    name: 'ark-core:relay',
    script: path.resolve(__dirname, '../../../app/start-relay.js'),
    args: [
      '--config', process.env.ARK_CONFIG
    ]
  })
}
