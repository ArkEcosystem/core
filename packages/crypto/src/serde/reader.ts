import ByteBuffer from "bytebuffer";

import { CryptoError } from "../errors";
import { IReader, ISchnorrMultiSignature } from "../interfaces";

export class Reader implements IReader {
    public readonly buffer: Buffer;
    public offset = 0;

    public constructor(buffer: Buffer) {
        this.buffer = buffer;
    }

    public getRemainder(): Buffer {
        return this.buffer.slice(this.offset);
    }

    public getRemainderLength(): number {
        return this.buffer.length - this.offset;
    }

    public jump(length: number): void {
        if (length < -this.offset || length > this.getRemainderLength()) {
            throw new CryptoError("Jump over buffer boundary.");
        }

        this.offset += length;
    }

    public readInt8(): number {
        const value = this.buffer.readInt8(this.offset);
        this.offset += 1;
        return value;
    }

    public readInt16BE(): number {
        const value = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return value;
    }

    public readInt16LE(): number {
        const value = this.buffer.readInt16LE(this.offset);
        this.offset += 2;
        return value;
    }

    public readInt32BE(): number {
        const value = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return value;
    }

    public readInt32LE(): number {
        const value = this.buffer.readInt32LE(this.offset);
        this.offset += 4;
        return value;
    }

    public readBigInt64BE(): bigint {
        const value = this.buffer.readBigInt64BE(this.offset);
        this.offset += 8;
        return value;
    }

    public readBigInt64LE(): bigint {
        const value = this.buffer.readBigInt64LE(this.offset);
        this.offset += 8;
        return value;
    }

    public readUInt8(): number {
        const value = this.buffer.readUInt8(this.offset);
        this.offset += 1;
        return value;
    }

    public readUInt16BE(): number {
        const value = this.buffer.readUInt16BE(this.offset);
        this.offset += 2;
        return value;
    }

    public readUInt16LE(): number {
        const value = this.buffer.readUInt16LE(this.offset);
        this.offset += 2;
        return value;
    }

    public readUInt32BE(): number {
        const value = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return value;
    }

    public readUInt32LE(): number {
        const value = this.buffer.readUInt32LE(this.offset);
        this.offset += 4;
        return value;
    }

    public readBigUInt64BE(): bigint {
        const value = this.buffer.readBigUInt64BE(this.offset);
        this.offset += 8;
        return value;
    }

    public readBigUInt64LE(): bigint {
        const value = this.buffer.readBigUInt64LE(this.offset);
        this.offset += 8;
        return value;
    }

    public readBuffer(length: number): Buffer {
        if (length > this.getRemainderLength()) {
            throw new CryptoError("Read over buffer boundary.");
        }

        const value = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return value;
    }

    public readPublicKey(): Buffer {
        try {
            return this.readBuffer(33);
        } catch (cause) {
            throw new CryptoError("Cannot read public key.", { cause });
        }
    }

    public readEcdsaSignature(): Buffer {
        try {
            if (this.buffer.readUInt8(this.offset + 0) !== 0x30) {
                throw new CryptoError("Invalid marker.");
            }

            return this.readBuffer(2 + this.buffer.readUInt8(this.offset + 1));
        } catch (cause) {
            throw new CryptoError("Cannot read ECDSA signature.", { cause });
        }
    }

    public readSchnorrSignature(): Buffer {
        try {
            return this.readBuffer(64);
        } catch (cause) {
            throw new CryptoError("Cannot read Schnorr signature.", { cause });
        }
    }

    public readSchnorrMultiSignature(signatureCount: number): ISchnorrMultiSignature[] {
        const items: ISchnorrMultiSignature[] = [];

        for (let i = 0; i < signatureCount; i++) {
            const index = this.readUInt8();
            const signature = this.readSchnorrSignature();
            items.push({ index, signature });
        }

        return items;
    }

    public readWithByteBuffer<T>(cb: (byteBuffer: ByteBuffer) => T): T {
        const byteBuffer = ByteBuffer.wrap(this.buffer.slice(this.offset));
        const result = cb(byteBuffer);
        this.offset += byteBuffer.offset;
        return result;
    }
}
