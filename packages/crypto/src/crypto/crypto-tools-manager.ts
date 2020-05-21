import { Network } from "../interfaces";
import { Libraries } from "../interfaces/libraries";
import { HeightTracker, MilestoneManager } from "../managers";
import { Base58 } from "./base58";
import { Bip38 } from "./bip38";
import { Hash } from "./hash";
import { HashAlgorithms } from "./hash-algorithms";
import { HDWallet } from "./hdwallet";
import { Slots } from "./slots";

export class CryptoToolsManager<T> {
    public Bip38: Bip38;
    public Hash: Hash;
    public HashAlgorithms: HashAlgorithms;
    public HDWallet: HDWallet;
    public Slots: Slots<T>;
    public Base58: Base58;

    public constructor(
        libraries: Libraries,
        network: Network,
        milestoneManager: MilestoneManager<T>,
        heightTracker: HeightTracker,
    ) {
        this.Hash = new Hash(libraries);
        this.HashAlgorithms = new HashAlgorithms(libraries);
        this.Base58 = new Base58(libraries, this.HashAlgorithms);
        this.Bip38 = new Bip38(libraries, this.HashAlgorithms, this.Base58);
        this.HDWallet = new HDWallet(libraries, network);
        this.Slots = new Slots(libraries, milestoneManager, heightTracker);
    }

    public numberToHex(num: number, padding = 2): string {
        const indexHex: string = Number(num).toString(16);

        return "0".repeat(padding - indexHex.length) + indexHex;
    }
}
