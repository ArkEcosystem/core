module.exports = {
  initial: 'rebuilding',
  states: {
    rebuilding: {
      onEntry: ['checkLastDownloadedBlockSynced'],
      on: {
        SYNCED: 'waitingfinished',
        NOTSYNCED: 'rebuildBlocks',
        PAUSED: 'rebuildpaused'
      }
    },
    idle: {
      on: {
        DOWNLOADED: 'rebuildBlocks'
      }
    },
    rebuildBlocks: {
      onEntry: ['rebuildBlocks'],
      on: {
        DOWNLOADED: 'rebuilding',
        NOBLOCK: 'rebuilding'
      }
    },
    waitingfinished: {
      on: {
        REBUILDFINISHED: 'rebuildfinished'
      }
    },
    rebuildfinished: {
      onEntry: ['rebuildFinished']
    },
    rebuildpaused: {
      onEntry: ['downloadPaused'],
      on: {
        REBUILDFINISHED: 'processfinished'
      }
    },
    processfinished: {
      onEntry: ['checkRebuildBlockSynced'],
      on: {
        SYNCED: 'end',
        NOTSYNCED: 'rebuildBlocks'
      }
    },
    end: {
      onEntry: ['rebuildingComplete']
    }
  }
}
