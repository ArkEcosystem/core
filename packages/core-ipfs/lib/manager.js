const container = require('@arkecosystem/core-container')

const IPFS = require('ipfs')
// const CID = require('cids')
// const path = require('path')

const defaults = require('./defaults')

module.exports = class IPFSManager {
  constructor (options) {
    this.options = options
  }

  start () {
    this.node = new IPFS({
      repo: this.options.ipfsRepo,
      config: {
        Addresses: {
          Swarm: [
            `/ip4/0.0.0.0/tcp/${this.options.ipfsPort1}`,
            `/ip4/127.0.0.1/tcp/${this.options.ipfsPort2}/ws`
          ]
        }
      }
    })

    this.__registerErrorHandler()
  }

  stop () {
    this.node.stop((err) => {
      if (err.code === 'ERR_DB_DELETE_FAILED') console.log('db never created')
    })
  }

  onError (handlerFunction) {
    this.node.on('error', handlerFunction)
  }

  async __registerErrorHandler () {
    let logger = await container.resolvePlugin('logger')
    this.onError(logger.error)
  }

  getIpfsBlock (cid) {}

  getIpfsCID (version = 1, codec = defaults.constants.codecs.ark, multihash) {
    if (!multihash) return false
  }

  getCodec (name) {
    return defaults.constants.codecs[name]
  }

  getAllCodecs () {
    return defaults.constants.codecs
  }

  getAllCodecsOfType () {}
}
