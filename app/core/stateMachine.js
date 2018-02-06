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

const syncWithNetwork = {
  initial: 'syncing',
  states: {
    syncing: {
      onEntry: ['checkLastDownloadedBlockSynced'],
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
      onEntry: ['downloadBlocks'],
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
}

const fork = {
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
}

const blockchainMachine = Machine({
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
        SUCCESS: 'syncWithNetwork',
        FAILURE: 'exit'
      }
    },
    syncWithNetwork: {
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
