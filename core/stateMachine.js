const Machine = require('xstate').Machine

// const init = Machine({
//   initial: 'unitisalised',
//   states: {
//     unitisalised: {
//       on: {
//         START: 'mountDatabase'
//       }
//     },
//     mountDatabase: {
//       onEntry: ['mountDatabase'],
//       on: {
//         SUCCESS: 'mountNetwork',
//         FAILURE: 'failed'
//       }
//     },
//     mountNetwork: {
//       onEntry: ['mountNetwork'],
//       on: {
//         SUCCESS: 'initialised',
//         FAILURE: 'failed'
//       }
//     },
//     initialised: {
//     },
//     failed: {
//     }
//   }
// })

const syncWithNetwork = Machine({
  initial: 'syncing',
  states: {
    syncing: {
      onEntry: ['checkSynced'],
      on: {
        SYNCED: 'finished',
        NOTSYNCED: 'downloadBlocks'
      }
    },
    idle: {
      on: {
        DOWNLOADFINISHED: 'downloadBlocks',
        PROCESSFINISHED: 'syncing',
        PROCESSFFAILED: 'forked'
      }
    },
    downloadBlocks: {
      onEntry: ['triggerDownloadBlocks'],
      on: {
        DOWNLOADED: 'downloadBlocks',
        NOBLOCK: 'syncing'
      }
    },
    processBlocks: {
      onEntry: ['startProcessBlock'],
      on: {
        STARTED: 'idle'
      }
    },
    finished: {
      onEntry: ['syncingFinished']
    },
    forked: {
      onEntry: ['startRebuild']
    }
  }
})

const fork = Machine({
  initial: 'rebuilding',
  states: {
    rebuilding: {
      onEntry: ['rebuild'],
      on: {
        SUCCESS: 'rebuilt',
        FAILURE: 'exit'
      }
    },
    exit: {
      onEntry: ['resetNode']
    },
    rebuilt: {

    }
  }
})

const blockchainMachine = Machine({
  // start in the 'start' state
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
        SUCCESS: 'syncWithNetwork',
        FAILURE: 'exit'
      }
    },
    syncWithNetwork: {
      onEntry: 'startNetworkSync',
      on: {
        SYNCFINISHED: 'idle',
        FORK: 'fork'
      },
      ...syncWithNetwork
    },
    idle: {
      onEntry: ['checkLater'],
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
      on: {
        SUCCESS: 'syncWithNetwork',
        FAILURE: 'exit'
      },
      ...fork
    },
    exit: {
    }
  }
})

module.exports = blockchainMachine
