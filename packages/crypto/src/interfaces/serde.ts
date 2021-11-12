import ByteBuffer from "bytebuffer";

export interface IAddress {
    readonly serialized: Buffer;
    readonly network: number;

    toString(format?: "base58" | "base58c"): string;
    toJSON(): string;
}

export interface IReader {
    readonly buffer: Buffer;
    readonly offset: number;

    jump(length: number): void;

    readInt8(): number;
    readInt16BE(): number;
    readInt16LE(): number;
    readInt32BE(): number;
    readInt32LE(): number;
    readBigInt64BE(): bigint;
    readBigInt64LE(): bigint;

    readUInt8(): number;
    readUInt16BE(): number;
    readUInt16LE(): number;
    readUInt32BE(): number;
    readUInt32LE(): number;
    readBigUInt64BE(): bigint;
    readBigUInt64LE(): bigint;

    readBuffer(length: number): Buffer;
    readPublicKey(): Buffer;
    readEcdsaSignature(): Buffer;
    readSchnorrSignature(): Buffer;
    readAddress(): IAddress;

    readWithByteBufferBE<T>(cb: (byteBuffer: ByteBuffer) => T): T;
    readWithByteBufferLE<T>(cb: (byteBuffer: ByteBuffer) => T): T;
}

export interface IWriter {
    readonly buffer: Buffer;
    readonly offset: number;

    jump(length: number): void;

    writeInt8(value: number): void;
    writeInt16BE(value: number): void;
    writeInt16LE(value: number): void;
    writeInt32BE(value: number): void;
    writeInt32LE(value: number): void;
    writeBigInt64BE(value: bigint): void;
    writeBigInt64LE(value: bigint): void;

    writeUInt8(value: number): void;
    writeUInt16BE(value: number): void;
    writeUInt16LE(value: number): void;
    writeUInt32BE(value: number): void;
    writeUInt32LE(value: number): void;
    writeBigUInt64BE(value: bigint): void;
    writeBigUInt64LE(value: bigint): void;

    writeBuffer(value: Buffer): void;
    writePublicKey(value: Buffer): void;
    writeEcdsaSignature(value: Buffer): void;
    writeSchnorrSignature(value: Buffer): void;
    writeAddress(value: IAddress): void;

    writeWithByteBufferBE<T>(cb: (byteBuffer: ByteBuffer) => T): T;
    writeWithByteBufferLE<T>(cb: (byteBuffer: ByteBuffer) => T): T;
}
