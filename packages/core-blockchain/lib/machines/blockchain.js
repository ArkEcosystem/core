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
        START: 'init',
        STOP: 'stopped',
      },
    },
    init: {
      onEntry: ['init'],
      on: {
        REBUILD: 'rebuild',
        NETWORKSTART: 'idle',
        STARTED: 'syncWithNetwork',
        ROLLBACK: 'rollback',
        FAILURE: 'exit',
        STOP: 'stopped',
      },
    },
    rebuild: {
      on: {
        REBUILDCOMPLETE: 'syncWithNetwork',
        FORK: 'fork',
        TEST: 'syncWithNetwork',
        STOP: 'stopped',
      },
      ...rebuildFromNetwork,
    },
    syncWithNetwork: {
      on: {
        TEST: 'idle',
        SYNCFINISHED: 'idle',
        FORK: 'fork',
        STOP: 'stopped',
      },
      ...syncWithNetwork,
    },
    idle: {
      onEntry: ['checkLater', 'blockchainReady'],
      on: {
        WAKEUP: 'syncWithNetwork',
        NEWBLOCK: 'newBlock',
        STOP: 'stopped',
      },
    },
    newBlock: {
      on: {
        PROCESSFINISHED: 'idle',
        FORK: 'fork',
        STOP: 'stopped',
      },
    },
    fork: {
      onEntry: ['startForkRecovery'],
      on: {
        SUCCESS: 'syncWithNetwork',
        FAILURE: 'exit',
        STOP: 'stopped',
      },
      ...fork,
    },
    rollback: {
      onEntry: ['rollbackDatabase'],
      on: {
        SUCCESS: 'init',
        FAILURE: 'exit',
        STOP: 'stopped',
      },
    },
    /**
     * This state should be used for stopping the blockchain on purpose, not as
     * a result of critical errors. In those cases, using the `exit` state would
     * be a better option
     */
    stopped: {
      onEntry: ['stopped'],
    },
    exit: {
      onEntry: ['exitApp'],
    },
  },
})
