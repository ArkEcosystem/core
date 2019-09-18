export enum TransactionType {
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
    HtlcRefund = 10,
}

export enum TransactionTypeGroup {
    Test = 0,
    Core = 1,

    // Everything above is available to anyone
    Reserved = 1000,
}

export enum HtlcLockExpirationType {
    EpochTimestamp = 1,
    BlockHeight = 2,
}
