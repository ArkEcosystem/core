export interface DumpRange {
    firstBlockHeight: number,
    lastBlockHeight: number,
    blocksCount: number,

    firstTransactionTimestamp: number,
    lastTransactionTimestamp: number,
    transactionsCount: number

    firstRoundRound: number,
    lastRoundRound: number,
    roundsCount: number
}
