const dotenv = require('dotenv')
const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)
const splash = require('./commander/splash')

const start = async () => {
  // Exist if we are in OpenVZ, move this to the config later (config is mounted first)
  if (fs.existsSync('/proc/user_beancounters')) process.exit()

  splash()

  if (!fs.existsSync('.env') && !process.env.NETWORK) {
    const response = await require('./commander/configure-network')()

    await writeFile('.env', `NETWORK=${response.network}`, () => console.log(`${response.network} has been configured as your network.`))
  }

  dotenv.config()

  require('./commander/start')()
}

start()
