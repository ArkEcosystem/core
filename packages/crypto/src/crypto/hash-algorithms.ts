import { Libraries } from "./interfaces";

export class HashAlgorithms {
    public constructor(private libraries: Libraries) {}

    public ripemd160(buffer: Buffer | string): Buffer {
        return this.libraries.RIPEMD160.digest(this.bufferize(buffer));
    }

    public sha1(buffer: Buffer | string): Buffer {
        return this.libraries.SHA1.digest(this.bufferize(buffer));
    }

    public sha256(buffer: Buffer | string | Buffer[]): Buffer {
        if (Array.isArray(buffer)) {
            let sha256 = this.libraries.SHA256.ctx;

            sha256.init();

            for (const element of buffer) {
                sha256 = sha256.update(element);
            }

            return sha256.final();
        }

        return this.libraries.SHA256.digest(this.bufferize(buffer));
    }

    public hash160(buffer: Buffer | string): Buffer {
        return this.libraries.Hash160.digest(this.bufferize(buffer));
    }

    public hash256(buffer: Buffer | string): Buffer {
        return this.libraries.Hash256.digest(this.bufferize(buffer));
    }

    private bufferize(buffer: Buffer | string) {
        return buffer instanceof Buffer ? buffer : Buffer.from(buffer);
    }
}
