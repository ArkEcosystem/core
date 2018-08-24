const shuffle = require('lodash.shuffle')
const HttpClient = require('./http')
const resources = require('./resources')
const initialPeers = require('./peers')
const sortPeers = require('./utils/sort-peers')

module.exports = class ApiClient {
  /**
   * Finds all the available peers, sorted by block heigh and delay
   *
   * @param {String} network - Network name ('devnet' or 'mainnet')
   * @param {Number} version - API version
   */
  static async findPeers (network, version) {
    if (!initialPeers.hasOwnProperty(network)) {
      throw new Error(`Network "${network}" is not supported`)
    }

    const networkPeers = initialPeers[network]

    // Shuffle the peers to avoid connecting always to the first ones
    shuffle(networkPeers)

    const selfIps = ['127.0.0.1', '::ffff:127.0.0.1', '::1']
    let peers = null

    // Connect to each peer to get an updated list of peers until a success response
    for (const peer of networkPeers) {
      const peerUrl = `http://${peer.ip}:${peer.port}`

      // This method should not crash when a peer fails
      try {
        const client = new ApiClient(peerUrl, version)
        const response = await client.resource('peers').all()
        const { data } = response.data

        if (data.success && data.peers) {
          // Ignore local and unavailable peers
          peers = data.peers.filter(peer => {
            return selfIps.indexOf(peer.ip) === -1 && peer.status === 'OK'
          })

          if (peers.length) {
            break
          }
        }
      } catch (error) {
        // TODO only if a new feature to enable logging is added
        // console.log(`Cannot find find peers of \`${peerUrl}\``)
      }
    }

    // Return at least the initial (hardcoded) peers
    return sortPeers(peers && peers.length ? peers : networkPeers)
  }

  /**
   * Connects to a random peer of the network
   *
   * @param {String} network - Network name
   * @param {Number} version - API version
   */
  static async connect (network, version) {
    const peers = await ApiClient.findPeers(network, version)
    return new ApiClient(`http://${peers[0].ip}:${peers[0].port}`, version)
  }

  /**
   * @constructor
   * @param {String} host
   * @param {Number} version - API version
   */
  constructor (host, version) {
    this.setConnection(host)
    this.setVersion(version || 1)
  }

  /**
   * Create a HTTP connection to the API.
   * @param {String} host
   */
  setConnection (host) {
    this.http = new HttpClient(host, this.version)
  }

  /**
   * Get the HTTP connection to the API.
   * @return {Object}
   */
  getConnection () {
    return this.http
  }

  /**
   * Set the API Version.
   * @param {Number} version
   */
  setVersion (version) {
    if (!version) {
      throw new Error('A valid API version is required')
    }

    this.version = version
    this.http.setVersion(version)

    return this
  }

  /**
   * Create an instance of a version specific resource.
   * @param  {String}   name
   * @return {Resource}
   */
  resource (name) {
    return new resources[`v${this.version}`][name](this.http)
  }
}
