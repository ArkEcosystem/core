import * as networks from "./networks";

export type NetworkType =
    | typeof networks.mainnet.network
    | typeof networks.devnet.network
    | typeof networks.testnet.network;

export type NetworkName = keyof typeof networks;
