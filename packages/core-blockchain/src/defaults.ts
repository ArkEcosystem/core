export const defaults = {
    fastSync: !!process.env.CORE_BLOCKCHAIN_FAST_SYNC, // Improves sync rate for readonly nodes, that have a p2p port closed to public. Such node doesn't broadcast data
    databaseRollback: {
        maxBlockRewind: 10000,
        steps: 1000,
    },
};
