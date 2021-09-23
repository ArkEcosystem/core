import { State } from "@arkecosystem/core-interfaces";
export declare enum MagistrateIndex {
    Businesses = "businesses"
}
export declare const businessIndexer: (index: State.IWalletIndex, wallet: State.IWallet) => void;
