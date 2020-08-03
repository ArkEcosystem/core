export const Identifiers = {
    HTTP: Symbol.for("API<HTTP>"),
    HTTPS: Symbol.for("API<HTTPS>"),

    DbBlockService: Symbol.for("BlockExpressionBuilder"),
    DbTransactionService: Symbol.for("TransactionExpressionBuilder"),

    DbBlockResourceService: Symbol.for("BlockService"),
    TransactionService: Symbol.for("TransactionService"),
    PoolTransactionService: Symbol.for("PoolService"),
    WalletService: Symbol.for("WalletService"),
    DposDelegateService: Symbol.for("DposDelegateService"),
    HtlcLockService: Symbol.for("HtlcService"),
};
