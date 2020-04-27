import moize from "fast-memoize"; // TODO: consider interchangeable dependencies

import { HashAlgorithms } from "./hash-algorithms";
import { Libraries } from "./interfaces";

export class Base58 {
    public encode = moize(this.encoder.bind(this));
    public decode = moize(this.decoder.bind(this));

    public constructor(private libraries: Libraries, private hashAlgorithms: HashAlgorithms) {}

    private encoder(buffer: Buffer): string {
        const checksum: Buffer = this.hashAlgorithms.hash256(buffer);

        return this.libraries.base58.encode(Buffer.concat([buffer, checksum], buffer.length + 4));
    }

    private decoder(address: string): Buffer {
        const buffer: Buffer = this.libraries.base58.decode(address);
        const payload: Buffer = buffer.slice(0, -4);
        const checksum: Buffer = this.hashAlgorithms.hash256(payload);

        if (checksum.readUInt32LE(0) !== buffer.slice(-4).readUInt32LE(0)) {
            throw new Error("Invalid checksum");
        }

        return payload;
    }
}
