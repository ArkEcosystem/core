import { base58 } from "bstring";
import { HashAlgorithms } from "../crypto";

export class Base58 {
    public static encodeCheck(buffer: Buffer): string {
        const checksum: Buffer = HashAlgorithms.hash256(buffer);

        return base58.encode(Buffer.concat([buffer, checksum], buffer.length + 4));
    }

    public static decodeCheck(address: string): Buffer {
        const buffer: Buffer = base58.decode(address);
        const payload: Buffer = buffer.slice(0, -4);
        const checksum: Buffer = HashAlgorithms.hash256(payload);

        if (checksum.readUInt32LE(0) !== buffer.slice(-4).readUInt32LE(0)) {
            throw new Error("Invalid checksum");
        }

        return payload;
    }
}
