import { Hash160, Hash256, RIPEMD160, SHA1, SHA256 } from "bcrypto";

export class HashAlgorithms {
    public static ripemd160(buffer: Buffer | string): Buffer {
        return RIPEMD160.digest(this.bufferize(buffer));
    }

    public static sha1(buffer: Buffer | string): Buffer {
        return SHA1.digest(this.bufferize(buffer));
    }

    public static sha256(buffer: Buffer | string | Buffer[]): Buffer {
        if (Array.isArray(buffer)) {
            let sha256 = SHA256.ctx;

            sha256.init();

            for (const element of buffer) {
                sha256 = sha256.update(element);
            }

            return sha256.final();
        }

        return SHA256.digest(this.bufferize(buffer));
    }

    public static hash160(buffer: Buffer | string): Buffer {
        return Hash160.digest(this.bufferize(buffer));
    }

    public static hash256(buffer: Buffer | string): Buffer {
        return Hash256.digest(this.bufferize(buffer));
    }

    private static bufferize(buffer: Buffer | string) {
        return buffer instanceof Buffer ? buffer : Buffer.from(buffer);
    }
}
