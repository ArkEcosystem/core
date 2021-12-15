import ByteBuffer from "bytebuffer";

import { CryptoError } from "../errors";
import { ISchnorrMultiSignature, IWriter } from "../interfaces";

export class Writer implements IWriter {
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

    public getResult(): Buffer {
        return this.buffer.slice(0, this.offset);
    }

    public getResultLength(): number {
        return this.offset;
    }

    public reset(): void {
        this.offset = 0;
    }

    public jump(length: number): void {
        if (length < -this.offset || length > this.getRemainderLength()) {
            throw new CryptoError("Jump over buffer boundary.");
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
        if (value.length > this.getRemainderLength()) {
            throw new CryptoError("Write over buffer boundary.");
        }

        this.offset += value.copy(this.buffer, this.offset);
    }

    public writePublicKey(value: Buffer): void {
        try {
            if (value.length !== 33) {
                throw new CryptoError("Invalid length.");
            }

            this.writeBuffer(value);
        } catch (cause) {
            throw new CryptoError("Cannot write public key.", { cause });
        }
    }

    public writeEcdsaSignature(value: Buffer): void {
        try {
            if (value.readUInt8(0) !== 0x30) {
                throw new CryptoError("Invalid marker.");
            }

            if (value.readUInt8(1) !== value.length - 2) {
                throw new CryptoError("Invalid length.");
            }

            this.writeBuffer(value);
        } catch (cause) {
            throw new CryptoError("Cannot write ECDSA signature.", { cause });
        }
    }

    public writeSchnorrSignature(value: Buffer): void {
        try {
            if (value.length !== 64) {
                throw new CryptoError("Invalid length.");
            }

            this.writeBuffer(value);
        } catch (cause) {
            throw new CryptoError("Cannot write Schnorr signature.", { cause });
        }
    }

    public writeSchnorrMultiSignature(value: readonly ISchnorrMultiSignature[]): void {
        for (const item of value) {
            this.writeUInt8(item.index);
            this.writeSchnorrSignature(item.signature);
        }
    }
}
