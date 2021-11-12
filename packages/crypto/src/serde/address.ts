import base58 from "bcrypto/lib/encoding/base58";
import Hash256 from "bcrypto/lib/hash256";

export class Address {
    public readonly serialized: Buffer;
    public readonly network: number;

    private checksum?: Buffer;

    public constructor(serialized: Buffer) {
        if (serialized.length !== 21) {
            throw new Error("Invalid length.");
        }

        this.serialized = serialized;
        this.network = serialized.readUInt8(0);
    }

    public toString(format: "base58" | "base58c" = "base58c"): string {
        if (format === "base58") {
            return base58.encode(this.serialized);
        }

        if (format === "base58c") {
            if (!this.checksum) {
                const digest = Hash256.digest(this.serialized) as Buffer;
                this.checksum = Buffer.from([digest[0], digest[1], digest[2], digest[3]]);
            }

            return base58.encode(Buffer.concat([this.serialized, this.checksum]));
        }

        throw new Error("Unknown format.");
    }
}
