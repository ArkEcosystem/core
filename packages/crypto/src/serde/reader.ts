import ByteBuffer from "bytebuffer";

import { IAddress, IReader } from "../interfaces";
import { Factory } from "./factory";

export class Reader implements IReader {
    public readonly buffer: Buffer;
    public offset = 0;

    public constructor(buffer: Buffer) {
        this.buffer = buffer;
    }

    public jump(length: number): void {
        if (length < -this.offset || length > this.buffer.length - this.offset) {
            throw new RangeError("Jump over buffer boundary.");
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
        if (length > this.buffer.length - this.offset) {
            throw new Error("Read over buffer boundary.");
        }

        const value = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return value;
    }

    public readPublicKey(): Buffer {
        try {
            return this.readBuffer(33);
        } catch (error) {
            throw new Error(`Cannot read public key. ${error.message}`);
        }
    }

    public readEcdsaSignature(): Buffer {
        try {
            if (this.buffer.readUInt8(this.offset + 0) !== 0x30) {
                throw new Error("Invalid marker.");
            }

            return this.readBuffer(2 + this.buffer.readUInt8(this.offset + 1));
        } catch (error) {
            throw new Error(`Cannot read ECDSA signature. ${error.message}`);
        }
    }

    public readSchnorrSignature(): Buffer {
        try {
            return this.readBuffer(64);
        } catch (error) {
            throw new Error(`Cannot read Schnorr signature. ${error.message}`);
        }
    }

    public readAddress(): IAddress {
        try {
            return Factory.createAddress(this.readBuffer(21));
        } catch (error) {
            throw new Error(`Cannot read address. ${error.message}`);
        }
    }

    public readWithByteBufferBE<T>(cb: (byteBuffer: ByteBuffer) => T): T {
        const byteBuffer = ByteBuffer.wrap(this.buffer.slice(this.offset), undefined, false);
        const result = cb(byteBuffer);
        this.offset += byteBuffer.offset;
        return result;
    }

    public readWithByteBufferLE<T>(cb: (byteBuffer: ByteBuffer) => T): T {
        const byteBuffer = ByteBuffer.wrap(this.buffer.slice(this.offset), undefined, true);
        const result = cb(byteBuffer);
        this.offset += byteBuffer.offset;
        return result;
    }

    public getRemainder(): Buffer {
        return this.buffer.slice(this.offset);
    }
}
