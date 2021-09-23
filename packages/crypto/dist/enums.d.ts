export declare enum TransactionType {
    Transfer = 0,
    SecondSignature = 1,
    DelegateRegistration = 2,
    Vote = 3,
    MultiSignature = 4,
    Ipfs = 5,
    MultiPayment = 6,
    DelegateResignation = 7,
    HtlcLock = 8,
    HtlcClaim = 9,
    HtlcRefund = 10
}
export declare enum TransactionTypeGroup {
    Test = 0,
    Core = 1,
    Reserved = 1000
}
export declare enum HtlcLockExpirationType {
    EpochTimestamp = 1,
    BlockHeight = 2
}
