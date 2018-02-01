import { Machine } from 'xstate'

const blockchain = Machine({
  // start in the 'start' state
  initial: 'start',
  states: {
    start: {
      on: {
        REQUEST: 'init'
      }
    },
    init: {
      on: {
        SUCCESS: 'checkNetwork',
        FAILURE: 'exit'
      }
    },
    checkNetwork: {
      on: {
        SUCCESS: 'checkSync',
        FAILURE: 'checkNetwork'
      }
    },
    checkSync: {
      on: {
        SYNCED: 'idle',
        UNSYNCED: 'download'
      }
    },
    download: {
      on: {
        DOWNLOADED: 'process',
        NOBLOCK: 'checkSync',
        FAILURE: 'networkMissingBlock'
      }
    },
    idle: {
      on: {
        START: 'checkSync'
      }
    },
    exit: {
      on: {
        REQUEST: 'clean'
      }
    },
    clean: {
      on: {
        REQUEST: 'start'
      }
    }
  }
})

module.exports = blockchain
