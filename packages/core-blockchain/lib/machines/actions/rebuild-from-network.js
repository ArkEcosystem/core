module.exports = {
  initial: 'rebuilding',
  states: {
    rebuilding: {
      onEntry: ['checkLastDownloadedBlockSynced'],
      on: {
        SYNCED: 'waitingFinished',
        NOTSYNCED: 'rebuildBlocks',
        PAUSED: 'rebuildPaused',
      },
    },
    idle: {
      on: {
        DOWNLOADED: 'rebuildBlocks',
      },
    },
    rebuildBlocks: {
      onEntry: ['rebuildBlocks'],
      on: {
        DOWNLOADED: 'rebuilding',
        NOBLOCK: 'rebuilding',
      },
    },
    waitingFinished: {
      on: {
        REBUILDFINISHED: 'rebuildFinished',
      },
    },
    rebuildFinished: {
      onEntry: ['rebuildFinished'],
      on: {
        PROCESSFINISHED: 'processFinished',
      },
    },
    rebuildPaused: {
      onEntry: ['downloadPaused'],
      on: {
        REBUILDFINISHED: 'processFinished',
      },
    },
    processFinished: {
      onEntry: ['checkRebuildBlockSynced'],
      on: {
        SYNCED: 'end',
        NOTSYNCED: 'rebuildBlocks',
      },
    },
    end: {
      onEntry: ['rebuildingComplete'],
    },
  },
}
