module.exports = {
  initial: 'analysing',
  states: {
    analysing: {
      onEntry: ['analyseFork'],
      on: {
        REBUILD: 'revertBlocks',
        NOFORK: 'exit'
      }
    },
    network: {
      onEntry: ['checkNetwork']
      /* these transitions are not used yet (TODO?)
      on: {
        SUCCESS: 'blockchain',
        FAILURE: 'reset'
      }
      */
    },
    revertBlocks: {
    },
    exit: {
      onEntry: ['forkRecovered']
    }
  }
}

// const fork = {
//   initial: 'network',
//   states: {
//     network: {
//       onEntry: ['checkNetwork'],
//       on: {
//         SUCCESS: 'blockchain',
//         FAILURE: 'reset'
//       }
//     },
//     blockchain: {
//       onEntry: ['removeBlocks'],
//       on: {
//         SUCCESS: 'wallets',
//         FAILURE: 'reset'
//       }
//     },
//     wallets: {
//       onEntry: ['rebuildWallets'],
//       on: {
//         SUCCESS: 'success',
//         FAILURE: 'reset'
//       }
//     },
//     reset: {
//       onEntry: ['resetNode'],
//       on: {
//         RESET: 'success',
//         FAILURE: 'reset'
//       }
//     },
//     success: {
//     }
//   }
// }
