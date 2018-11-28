module.exports = {
  initial: 'syncing',
  states: {
    syncing: {
      onEntry: ['checkLastDownloadedBlockSynced'],
      on: {
        SYNCED: 'downloadFinished',
        NOTSYNCED: 'downloadBlocks',
        PAUSED: 'downloadPaused',
        NETWORKHALTED: 'end',
      },
    },
    idle: {
      on: {
        DOWNLOADED: 'downloadBlocks',
      },
    },
    downloadBlocks: {
      onEntry: ['downloadBlocks'],
      on: {
        DOWNLOADED: 'syncing',
        NOBLOCK: 'syncing',
      },
    },
    downloadFinished: {
      onEntry: ['downloadFinished'],
      on: {
        PROCESSFINISHED: 'processFinished',
      },
    },
    downloadPaused: {
      onEntry: ['downloadPaused'],
      on: {
        PROCESSFINISHED: 'processFinished',
      },
    },
    processFinished: {
      onEntry: ['checkLastBlockSynced'],
      on: {
        SYNCED: 'end',
        NOTSYNCED: 'downloadBlocks',
      },
    },
    end: {
      onEntry: ['syncingComplete'],
    },
  },
}
