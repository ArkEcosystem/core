const fs = require('fs')
const os = require('os')
const path = require('path')
const { splash, getProcessStatus } = require('./utils')

const start = async () => {
  splash()

  process.env.ARK_CONFIG = path.resolve(os.homedir(), '.ark')

  if (!fs.existsSync(process.env.ARK_CONFIG)) await require('./commands/configure-network')()

  require('./commands/start')()
}

getProcessStatus(() => start())
