const dotenv = require('dotenv')
const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)

const start = async () => {
  if (!fs.existsSync('.env') && !process.env.NETWORK) {
    const response = await require('./wizard/configure-network')()

    await writeFile('.env', `NETWORK=${response.network}`, () => console.log(`${response.network} has been configured as your network.`))
  }

  dotenv.config()

  require('./wizard/start')()
}

start()
