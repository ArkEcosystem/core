/**
 * @export
 * @enum {number}
 */
export enum InternalEvent {
    DisconnectPeer = "internal.p2p.disconnectPeer",
    MilestoneChanged = "internal.milestone.changed",
    StateBuilderFinished = "internal.stateBuilder.finished",

    ServiceProviderRegistered = "internal.serviceProvider.registered",
    ServiceProviderBooted = "internal.serviceProvider.booted",
    ServiceProviderDisposed = "internal.serviceProvider.disposed",
}

/**
 * @export
 * @enum {number}
 */
export enum StateEvent {
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
    RoundMissed = "round.missed",
    StateBuilderFinished = "stateBuilder.finished",
    StateStarting = "state.starting",
    StateStarted = "state.started",
    TransactionApplied = "transaction.applied",
    TransactionExpired = "transaction.expired",
    TransactionForged = "transaction.forged",
    TransactionPoolAdded = "transaction.pool.added",
    TransactionPoolRejected = "transaction.pool.rejected",
    TransactionPoolRemoved = "transaction.pool.removed",
    TransactionReverted = "transaction.reverted",
}
