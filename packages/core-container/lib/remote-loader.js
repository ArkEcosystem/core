const axios = require('axios')
const expandHomeDir = require('expand-home-dir')
const fs = require('fs-extra')
const path = require('path')
const {
  models: { Block },
} = require('@arkecosystem/crypto')
const { spawnSync } = require('child_process')

module.exports = class RemoteLoader {
  constructor(variables) {
    this.remote = variables.remote
    this.config = expandHomeDir(variables.config)
    this.data = expandHomeDir(variables.data)

    fs.ensureDirSync(this.config)
  }

  async setUp() {
    const network = await this.__configureNetwork()

    await this.__configureGenesisBlock()

    await this.__configurePeers()

    await this.__configureDelegates()

    this.__configurePlugins(network)

    this.__configureDatabase(network)
  }

  async __configureNetwork() {
    const network = await this.__getConfig('network')

    this.__writeConfig('network', network)

    return network
  }

  async __configureGenesisBlock() {
    const genesisBlock = await this.__getConfig('genesis-block')
    const genesisBlockModel = new Block(genesisBlock)

    if (!genesisBlockModel.verification.verified) {
      console.error(
        'Failed to verify the genesis block. Try another remote host.',
      )
      process.exit(1)
    }

    this.__writeConfig('genesisBlock', genesisBlock)
  }

  async __configurePeers() {
    const peers = await this.__getConfig('peers')

    this.__writeConfig('peers', peers)
  }

  async __configureDelegates() {
    const delegates = await this.__getConfig('delegates')

    this.__writeConfig('delegates', delegates)
  }

  __configurePlugins(network) {
    const plugins = path.resolve(
      __dirname,
      `../../core/lib/config/${network.name}/plugins.js`,
    )

    fs.copySync(plugins, `${this.config}/plugins.js`)
  }

  __configureDatabase(network) {
    const command = spawnSync('createdb', [`ark_${network.name}`])

    if (command.stderr.length > 0) {
      console.error(command.stderr.toString())
      process.exit(1)
    }

    console.info(command.stdout.toString())
  }

  async __getConfig(type) {
    try {
      const { data } = await axios.get(`http://${this.remote}/config/${type}`)

      return data.data
    } catch (error) {
      if (!this.__exists(type)) {
        console.error(error.message)
        process.exit(1)
      }
    }
  }

  __writeConfig(file, data) {
    fs.writeFileSync(
      `${this.config}/${file}.json`,
      JSON.stringify(data, null, 4),
    )
  }

  __exists(file) {
    return fs.existsSync(`${this.config}/${file}.json`)
  }
}
