import { Network } from "../interfaces";
import { MilestoneManager } from "../managers";
import { Base58 } from "./base58";
import { Bip38 } from "./bip38";
import { Hash } from "./hash";
import { HashAlgorithms } from "./hash-algorithms";
import { HDWallet } from "./hdwallet";
import { Libraries } from "./interfaces";
import { Slots } from "./slots";

export class CryptoTools {
    public Bip38: Bip38;
    public Hash: Hash;
    public HashAlgorithms: HashAlgorithms;
    public HDWallet: HDWallet;
    public Slots: Slots;
    public Base58: Base58;

    public constructor(libraries: Libraries, network: Network, milestoneManager: MilestoneManager) {
        this.Hash = new Hash(libraries);
        this.HashAlgorithms = new HashAlgorithms(libraries);
        this.Base58 = new Base58(libraries, this.HashAlgorithms);
        this.Bip38 = new Bip38(libraries, this.HashAlgorithms, this.Base58);
        this.HDWallet = new HDWallet(libraries, network);
        this.Slots = new Slots(libraries, milestoneManager);
    }

    public numberToHex(num: number, padding = 2): string {
        const indexHex: string = Number(num).toString(16);

        return "0".repeat(padding - indexHex.length) + indexHex;
    }
}
