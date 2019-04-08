import { devnet, mainnet, testnet, unitnet } from "./networks";

export type INetwork = typeof mainnet.network | typeof devnet.network | typeof testnet.network | typeof unitnet.network;
