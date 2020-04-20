export const Identifiers = {
    SnapshotVersion: Symbol.for("Snapshot<Version>"),
    SnapshotCodec: Symbol.for("Snapshot<Codec>"),
    SnapshotAction: Symbol.for("Snapshot<Action>"),
    SnapshotDatabaseConnection: Symbol.for("Snapshot<DatabaseConnection>"),
    SnapshotDatabaseService: Symbol.for("Service<SnapshotDatabase>"),
    SnapshotBlockRepository: Symbol.for("Snapshot<BlockRepository>"),
    SnapshotRoundRepository: Symbol.for("Snapshot<RoundRepository>"),
    SnapshotTransactionRepository: Symbol.for("Snapshot<TransactionRepository>"),
    SnapshotFilesystem: Symbol.for("Snapshot<Filesystem>"),
    ProgressDispatcher: Symbol.for("Snapshot<ProgressDispatcher>"),
};
