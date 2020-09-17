export enum MagistrateTransactionType {
    BusinessRegistration = 0,
    BusinessResignation = 1,
    BusinessUpdate = 2,
    BridgechainRegistration = 3,
    BridgechainResignation = 4,
    BridgechainUpdate = 5,
    Entity = 6,
}

export const MagistrateTransactionGroup = 2;

export enum MagistrateTransactionStaticFees {
    BusinessRegistration = "5000000000",
    BusinessResignation = "5000000000",
    BusinessUpdate = "5000000000",
    BridgechainRegistration = "5000000000",
    BridgechainResignation = "5000000000",
    BridgechainUpdate = "5000000000",
    EntityRegister = "5000000000",
    EntityUpdate = "500000000",
    EntityResign = "500000000",
}

// Entity types can be any integer between 0-255 but this enum keeps track of what has been assigned already
export enum EntityType {
    Business = 0,
    Product = 1,
    Plugin = 2,
    Module = 3,
    Delegate = 4,
}

export enum EntityAction {
    Register = 0,
    Update = 1,
    Resign = 2,
}
