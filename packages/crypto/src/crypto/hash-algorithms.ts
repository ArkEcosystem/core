import createHash from "create-hash";

export class HashAlgorithms {
    /**
     * Create a "ripemd160" buffer.
     */
    public static ripemd160(buffer: Buffer | string): Buffer {
        return createHash("rmd160")
            .update(buffer)
            .digest();
    }

    /**
     * Create a "sha1" buffer.
     */
    public static sha1(buffer: Buffer | string): Buffer {
        return createHash("sha1")
            .update(buffer)
            .digest();
    }

    /**
     * Create a "sha256" buffer.
     * @param  {Buffer} buffer
     * @return {Buffer}
     */
    public static sha256(buffer: Buffer | string): Buffer {
        return createHash("sha256")
            .update(buffer)
            .digest();
    }

    /**
     * Create a "hash160" buffer.
     */
    public static hash160(buffer: Buffer | string): Buffer {
        return this.ripemd160(this.sha256(buffer));
    }

    /**
     * Create a "hash256" buffer.
     */
    public static hash256(buffer: Buffer | string): Buffer {
        return this.sha256(this.sha256(buffer));
    }
}
