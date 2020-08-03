export const Identifiers = {
    HTTP: Symbol.for("API<HTTP>"),
    HTTPS: Symbol.for("API<HTTPS>"),

    DbBlockService: Symbol.for("DbBlockService"),
    DbTransactionService: Symbol.for("DbTransactionService"),

    BlockResourceDbProvider: Symbol.for("BlockResourceDbProvider"),
    BlockResourceStateProvider: Symbol.for("BlockResourceStateProvider"),
    TransactionResourceDbProvider: Symbol.for("TransactionResourceDbProvider"),
    TransactionResourcePoolProvider: Symbol.for("TransactionResourcePoolProvider"),
    WalletResourceProvider: Symbol.for("WalletResourceProvider"),
    DelegateResourceProvider: Symbol.for("DelegateResourceProvider"),
    LockResourceProvider: Symbol.for("LockResourceProvider"),
};
