import { EventEmitter } from "./emitter";
export declare const plugin: {
    pkg: any;
    required: boolean;
    alias: string;
    register(): EventEmitter;
};
export declare enum ApplicationEvents {
    ApplicationShutdown = "shutdown",
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
    InternalMilestoneChanged = "internal.milestone.changed",
    PeerAdded = "peer.added",
    PeerRemoved = "peer.removed",
    RoundApplied = "round.applied",
    RoundCreated = "round.created",
    RoundMissed = "round.missed",
    SnapshotStart = "snapshot.start",
    SnapshotProgress = "snapshot.progress",
    SnapshotComplete = "snapshot.complete",
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
    WalletVote = "wallet.vote",
    WalletUnvote = "wallet.unvote"
}
