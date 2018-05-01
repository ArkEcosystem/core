module.exports = {
  initial: 'syncing',
  states: {
    syncing: {
      onEntry: ['checkLastDownloadedBlockSynced'],
      on: {
        SYNCED: 'downloadfinished',
        NOTSYNCED: 'downloadBlocks',
        PAUSED: 'downloadpaused'
      }
    },
    idle: {
      on: {
        DOWNLOADED: 'downloadBlocks'
      }
    },
    downloadBlocks: {
      onEntry: ['downloadBlocks'],
      on: {
        DOWNLOADED: 'syncing',
        NOBLOCK: 'syncing'
      }
    },
    downloadfinished: {
      onEntry: ['downloadFinished'],
      on: {
        PROCESSFINISHED: 'processfinished'
      }
    },
    downloadpaused: {
      onEntry: ['downloadPaused'],
      on: {
        PROCESSFINISHED: 'processfinished'
      }
    },
    processfinished: {
      onEntry: ['checkLastBlockSynced'],
      on: {
        SYNCED: 'end',
        NOTSYNCED: 'downloadBlocks'
      }
    },
    end: {
      onEntry: ['syncingComplete']
    }
  }
}
