import { devnet } from "./devnet";
import { mainnet } from "./mainnet";
import { testnet } from "./testnet";
import { osmose_testnet } from "./osmose_testnet";
import { unitnet } from "./unitnet";

export type INetwork = typeof mainnet.network | typeof devnet.network | typeof testnet.network | typeof unitnet.network | typeof osmose_testnet.network;

export { devnet, mainnet, testnet, unitnet, osmose_testnet };
