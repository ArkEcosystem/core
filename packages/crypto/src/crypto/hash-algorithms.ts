import { Hash160, Hash256, RIPEMD160, SHA1, SHA256 } from "bcrypto";

export class HashAlgorithms {
    /**
     * Create a "ripemd160" buffer.
     */
    public static ripemd160(buffer: Buffer | string): Buffer {
        return RIPEMD160.digest(buffer);
    }

    /**
     * Create a "sha1" buffer.
     */
    public static sha1(buffer: Buffer | string): Buffer {
        return SHA1.digest(buffer);
    }

    /**
     * Create a "sha256" buffer.
     * @param  {Buffer} buffer
     * @return {Buffer}
     */
    public static sha256(buffer: Buffer | string): Buffer {
        return SHA256.digest(buffer);
    }

    /**
     * Create a "hash160" buffer.
     */
    public static hash160(buffer: Buffer | string): Buffer {
        return Hash160.digest(buffer);
    }

    /**
     * Create a "hash256" buffer.
     */
    public static hash256(buffer: Buffer | string): Buffer {
        return Hash256.digest(buffer);
    }
}
