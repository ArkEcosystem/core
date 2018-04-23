const Machine = require('xstate').Machine

module.exports = Machine({
  initial: 'unitisalised',
  states: {
    unitisalised: {
      on: {
        START: 'mountDatabase'
      }
    },
    mountDatabase: {
      onEntry: ['mountDatabase'],
      on: {
        SUCCESS: 'mountNetwork',
        FAILURE: 'failed'
      }
    },
    mountNetwork: {
      onEntry: ['mountNetwork'],
      on: {
        SUCCESS: 'initialised',
        FAILURE: 'failed'
      }
    },
    initialised: {
    },
    failed: {
    }
  }
})
