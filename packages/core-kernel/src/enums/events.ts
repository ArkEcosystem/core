/**
 * @export
 * @enum {number}
 */
export enum Internal {
    DisconnectPeer = "internal.p2p.disconnectPeer",
    MilestoneChanged = "internal.milestone.changed",
    StateBuilderFinished = "internal.stateBuilder.finished",
}

/**
 * @export
 * @enum {number}
 */
export enum State {
    BlockApplied = "block.applied",
    BlockDisregarded = "block.disregarded",
    BlockForged = "block.forged",
    BlockReceived = "block.received",
    BlockReverted = "block.reverted",
    DelegateRegistered = "delegate.registered",
    DelegateResigned = "delegate.resigned",
    ForgerFailed = "forger.failed",
    ForgerMissing = "forger.missing",
    ForgerStarted = "forger.started",
    PeerAdded = "peer.added",
    PeerRemoved = "peer.removed",
    RoundApplied = "round.applied",
    RoundCreated = "round.created",
    StateStarted = "state.started",
    TransactionApplied = "transaction.applied",
    TransactionExpired = "transaction.expired",
    TransactionForged = "transaction.forged",
    TransactionPoolAdded = "transaction.pool.added",
    TransactionPoolRejected = "transaction.pool.rejected",
    TransactionPoolRemoved = "transaction.pool.removed",
    TransactionReverted = "transaction.reverted",
    WalletColdCreated = "wallet.created.cold",
    WalletSaved = "wallet.saved",
}

/**
 * @export
 * @enum {number}
 */
export enum Action {}
