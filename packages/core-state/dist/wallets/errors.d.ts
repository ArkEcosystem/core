export declare class WalletsError extends Error {
    constructor(message: string);
}
export declare class WalletIndexAlreadyRegisteredError extends WalletsError {
    constructor(what: string);
}
export declare class WalletIndexNotFoundError extends WalletsError {
    constructor(what: string);
}
