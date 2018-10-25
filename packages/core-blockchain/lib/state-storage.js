'use strict'

const blockchainMachine = require('./machines/blockchain')

/**
 * Represents an in-memory storage for state machine data.
 */
class StateStorage {
  constructor () {
    this.blockchain = blockchainMachine.initialState
    this.lastDownloadedBlock = null
    this.lastBlock = null
    this.blockPing = null
    this.started = false
    this.rebuild = true
    this.fastRebuild = false
    this.noBlockCounter = 0
  }
}

module.exports = new StateStorage()
