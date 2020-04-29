import { IKeyPair } from "../interfaces";
import { LibraryManager } from "../managers/library-manager";
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

export class WIF<T> {
    public constructor(private libraryManager: LibraryManager<T>, private version: number, private keys: Keys<T>) {}

    public fromPassphrase(passphrase: string): string {
        const keys: IKeyPair = this.keys.fromPassphrase(passphrase);

        return this.libraryManager.Libraries.wif.encode(
            this.version,
            Buffer.from(keys.privateKey, "hex"),
            keys.compressed,
        );
    }

    public fromKeys(keys: IKeyPair): string {
        return this.libraryManager.Libraries.wif.encode(
            this.version,
            Buffer.from(keys.privateKey, "hex"),
            keys.compressed,
        );
    }
}
