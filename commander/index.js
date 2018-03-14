const fs = require('fs')
const os = require('os')
const path = require('path')
const { splash } = require('commander/utils')

const start = async () => {
  // Exist if we are in OpenVZ, move this to the config later (config is mounted first)
  if (fs.existsSync('/proc/user_beancounters')) process.exit()

  splash()

  process.env.ARK_CONFIG = path.resolve(os.homedir(), '.ark')

  if (!fs.existsSync(process.env.ARK_CONFIG)) await require('./commands/configure-network')()

  require('./commands/start')()
}

start()
