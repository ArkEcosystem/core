const Machine = require('xstate').Machine
const syncWithNetwork = require('./actions/sync-with-network')
const rebuildFromNetwork = require('./actions/rebuild-from-network')
const fork = require('./actions/fork')

module.exports = Machine({
  key: 'blockchain',
  initial: 'uninitialised',
  states: {
    uninitialised: {
      on: {
        START: 'init'
      }
    },
    init: {
      onEntry: ['init'],
      on: {
        REBUILD: 'rebuild',
        NETWORKSTART: 'idle',
        STARTED: 'syncWithNetwork',
        FAILURE: 'exit'
      }
    },
    rebuild: {
      on: {
        REBUILDCOMPLETE: 'syncWithNetwork',
        FORK: 'fork'
      },
      ...rebuildFromNetwork
    },
    syncWithNetwork: {
      on: {
        TEST: 'idle',
        SYNCFINISHED: 'idle',
        FORK: 'fork'
      },
      ...syncWithNetwork
    },
    idle: {
      onEntry: ['checkLater', 'blockchainReady'],
      on: {
        WAKEUP: 'syncWithNetwork',
        NEWBLOCK: 'processingBlock'
      }
    },
    processingBlock: {
      onEntry: ['processBlock'],
      on: {
        SUCCESS: 'idle',
        FAILURE: 'fork'
      }
    },
    fork: {
      onEntry: ['startForkRecovery'],
      on: {
        SUCCESS: 'syncWithNetwork',
        FAILURE: 'exit'
      },
      ...fork
    },
    exit: {
      onEntry: ['exitApp']
    }
  }
})
