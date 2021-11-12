import ByteBuffer from "bytebuffer";

import { IAddress, IWriter } from "../interfaces";

export class Writer implements IWriter {
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

    public writeInt8(value: number): void {
        this.offset = this.buffer.writeInt8(value, this.offset);
    }

    public writeInt16BE(value: number): void {
        this.offset = this.buffer.writeInt16BE(value, this.offset);
    }

    public writeInt16LE(value: number): void {
        this.offset = this.buffer.writeInt16LE(value, this.offset);
    }

    public writeInt32BE(value: number): void {
        this.offset = this.buffer.writeInt32BE(value, this.offset);
    }

    public writeInt32LE(value: number): void {
        this.offset = this.buffer.writeInt32LE(value, this.offset);
    }

    public writeBigInt64BE(value: bigint): void {
        this.offset = this.buffer.writeBigInt64BE(value, this.offset);
    }

    public writeBigInt64LE(value: bigint): void {
        this.offset = this.buffer.writeBigInt64LE(value, this.offset);
    }

    public writeUInt8(value: number): void {
        this.offset = this.buffer.writeUInt8(value, this.offset);
    }

    public writeUInt16BE(value: number): void {
        this.offset = this.buffer.writeUInt16BE(value, this.offset);
    }

    public writeUInt16LE(value: number): void {
        this.offset = this.buffer.writeUInt16LE(value, this.offset);
    }

    public writeUInt32BE(value: number): void {
        this.offset = this.buffer.writeUInt32BE(value, this.offset);
    }

    public writeUInt32LE(value: number): void {
        this.offset = this.buffer.writeUInt32LE(value, this.offset);
    }

    public writeBigUInt64BE(value: bigint): void {
        this.offset = this.buffer.writeBigUInt64BE(value, this.offset);
    }

    public writeBigUInt64LE(value: bigint): void {
        this.offset = this.buffer.writeBigUInt64LE(value, this.offset);
    }

    public writeBuffer(value: Buffer): void {
        if (value.length > this.buffer.length - this.offset) {
            throw new Error("Write over buffer boundary.");
        }

        this.offset += value.copy(this.buffer, this.offset);
    }

    public writePublicKey(value: Buffer): void {
        try {
            if (value.length !== 33) {
                throw new Error("Invalid length.");
            }

            this.writeBuffer(value);
        } catch (error) {
            throw new Error(`Cannot write public key. ${error.message}`);
        }
    }

    public writeEcdsaSignature(value: Buffer): void {
        try {
            if (value.readUInt8(0) !== 0x30) {
                throw new Error("Invalid marker.");
            }

            if (value.readUInt8(1) !== value.length - 2) {
                throw new Error("Invalid length.");
            }

            this.writeBuffer(value);
        } catch (error) {
            throw new Error(`Cannot write ECDSA signature. ${error.message}`);
        }
    }

    public writeSchnorrSignature(value: Buffer): void {
        try {
            if (value.length !== 64) {
                throw new Error("Invalid length.");
            }

            this.writeBuffer(value);
        } catch (error) {
            throw new Error(`Cannot write Schnorr signature. ${error.message}`);
        }
    }

    public writeAddress(value: IAddress): void {
        try {
            this.writeBuffer(value.serialized);
        } catch (error) {
            throw new Error(`Cannot write address. ${error.message}`);
        }
    }

    public writeWithByteBufferBE<T>(cb: (byteBuffer: ByteBuffer) => T): T {
        const byteBuffer = ByteBuffer.wrap(this.buffer.slice(this.offset), undefined, false);
        const result = cb(byteBuffer);
        this.offset += byteBuffer.offset;
        return result;
    }

    public writeWithByteBufferLE<T>(cb: (byteBuffer: ByteBuffer) => T): T {
        const byteBuffer = ByteBuffer.wrap(this.buffer.slice(this.offset), undefined, true);
        const result = cb(byteBuffer);
        this.offset += byteBuffer.offset;
        return result;
    }

    public getResult(): Buffer {
        return this.buffer.slice(0, this.offset);
    }
}
