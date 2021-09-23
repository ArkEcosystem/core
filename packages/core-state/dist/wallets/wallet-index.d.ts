import { State } from "@arkecosystem/core-interfaces";
export declare class WalletIndex implements State.IWalletIndex {
    readonly indexer: State.WalletIndexer;
    private walletIndex;
    constructor(indexer: State.WalletIndexer);
    entries(): ReadonlyArray<[string, State.IWallet]>;
    keys(): string[];
    values(): ReadonlyArray<State.IWallet>;
    index(wallet: State.IWallet): void;
    has(key: string): boolean;
    get(key: string): State.IWallet | undefined;
    set(key: string, wallet: State.IWallet): void;
    forget(key: string): void;
    clear(): void;
}
