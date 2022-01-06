import { Hash160, Hash256, RIPEMD160, SHA1, SHA256 } from "bcrypto";

export class HashAlgorithms {
    public static ripemd160(buff: Buffer | string): Buffer {
        return RIPEMD160.digest(this.bufferize(buff));
    }

    public static sha1(buff: Buffer | string): Buffer {
        return SHA1.digest(this.bufferize(buff));
    }

    public static sha256(buff: Buffer | string | Buffer[]): Buffer {
        if (Array.isArray(buff)) {
            let sha256 = SHA256.ctx;

            sha256.init();

            for (const element of buff) {
                sha256 = sha256.update(element);
            }

            return sha256.final();
        }

        return SHA256.digest(this.bufferize(buff));
    }

    public static hash160(buff: Buffer | string): Buffer {
        return Hash160.digest(this.bufferize(buff));
    }

    public static hash256(buff: Buffer | string): Buffer {
        return Hash256.digest(this.bufferize(buff));
    }

    private static bufferize(buff: Buffer | string) {
        return buff instanceof Buffer ? buff : Buffer.from(buff);
    }
}
