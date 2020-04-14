export const Identifiers = {
    SnapshotDatabaseConnection: Symbol.for("Snapshot<DatabaseConnection>"),
    SnapshotDatabaseService: Symbol.for("Service<SnapshotDatabase>"),
    SnapshotBlockRepository: Symbol.for("Snapshot<BlockRepository>"),
    SnapshotRoundRepository: Symbol.for("Snapshot<RoundRepository>"),
    SnapshotTransactionRepository: Symbol.for("Snapshot<TransactionRepository>"),
    SnapshotUtils: Symbol.for("Snapshot<Utils>"),
    ProgressDispatcher: Symbol.for("Snapshot<ProgressDispatcher>"),
};
