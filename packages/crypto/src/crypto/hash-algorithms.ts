import { Hash160, Hash256, RIPEMD160, SHA1, SHA256 } from "bcrypto";

export class HashAlgorithms {
    /**
     * Create a "ripemd160" buffer.
     */
    public static ripemd160(buffer: Buffer | string): Buffer {
        buffer = buffer instanceof Buffer ? buffer : Buffer.from(buffer);
        return RIPEMD160.digest(buffer);
    }

    /**
     * Create a "sha1" buffer.
     */
    public static sha1(buffer: Buffer | string): Buffer {
        buffer = buffer instanceof Buffer ? buffer : Buffer.from(buffer);
        return SHA1.digest(buffer);
    }

    /**
     * Create a "sha256" buffer.
     * @param  {Buffer} buffer
     * @return {Buffer}
     */
    public static sha256(buffer: Buffer | string | Buffer[]): Buffer {
        if (Array.isArray(buffer)) {
            let sha256 = SHA256.ctx;
            sha256.init();
            buffer.forEach(element => {
                sha256 = sha256.update(element);
            });

            return sha256.final();
        }

        buffer = buffer instanceof Buffer ? buffer : Buffer.from(buffer);
        return SHA256.digest(buffer);
    }

    /**
     * Create a "hash160" buffer.
     */
    public static hash160(buffer: Buffer | string): Buffer {
        buffer = buffer instanceof Buffer ? buffer : Buffer.from(buffer);
        return Hash160.digest(buffer);
    }

    /**
     * Create a "hash256" buffer.
     */
    public static hash256(buffer: Buffer | string): Buffer {
        buffer = buffer instanceof Buffer ? buffer : Buffer.from(buffer);
        return Hash256.digest(buffer);
    }
}
