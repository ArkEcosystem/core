import { IKeyPair } from "../interfaces";
import { Keys } from "./keys";

export interface WIFReturn {
    readonly version: number;
    readonly privateKey: Buffer;
    readonly compressed: boolean;
}

export interface WifAlgorithm {
    decode(string: string, version: number): WIFReturn;
    encode(version: number, privateKey: Buffer, compressed: boolean): string;
}

export class WIF {
    /**
     * @param wifAlgorithm // import wif from "wif"
     * @param version // configManager.get("network").wif
     * @param keys
     */
    public constructor(private wifAlgorithm: WifAlgorithm, private version: number, private keys: Keys) {}

    public fromPassphrase(passphrase: string): string {
        const keys: IKeyPair = this.keys.fromPassphrase(passphrase);

        return this.wifAlgorithm.encode(this.version, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }

    public fromKeys(keys: IKeyPair): string {
        return this.wifAlgorithm.encode(this.version, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }
}
