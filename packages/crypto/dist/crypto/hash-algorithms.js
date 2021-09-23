"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypto_1 = require("bcrypto");
class HashAlgorithms {
    static ripemd160(buffer) {
        return bcrypto_1.RIPEMD160.digest(this.bufferize(buffer));
    }
    static sha1(buffer) {
        return bcrypto_1.SHA1.digest(this.bufferize(buffer));
    }
    static sha256(buffer) {
        if (Array.isArray(buffer)) {
            let sha256 = bcrypto_1.SHA256.ctx;
            sha256.init();
            for (const element of buffer) {
                sha256 = sha256.update(element);
            }
            return sha256.final();
        }
        return bcrypto_1.SHA256.digest(this.bufferize(buffer));
    }
    static hash160(buffer) {
        return bcrypto_1.Hash160.digest(this.bufferize(buffer));
    }
    static hash256(buffer) {
        return bcrypto_1.Hash256.digest(this.bufferize(buffer));
    }
    static bufferize(buffer) {
        return buffer instanceof Buffer ? buffer : Buffer.from(buffer);
    }
}
exports.HashAlgorithms = HashAlgorithms;
//# sourceMappingURL=hash-algorithms.js.map