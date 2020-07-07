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
    Entity = "5000000000",
}

export enum EntityType {
    Business = 0,
    Bridgechain = 1,
    Developer = 2,
    Plugin = 3,
    Delegate = 4,
}

export enum EntitySubType {
    None = 0,
    PluginCore = 1,
    PluginDesktop = 2,
}

export enum EntityAction {
    Register = 0,
    Update = 1,
    Resign = 2,
}
