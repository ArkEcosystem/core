export class ByteBuffer {
    private readonly buff: Buffer;
    private offset = 0;

    public constructor(buff: Buffer) {
        this.buff = buff;
    }

    public getRemainder(): Buffer {
        return this.buff.slice(this.offset);
    }

    public getRemainderLength(): number {
        return this.buff.length - this.offset;
    }

    public getResult(): Buffer {
        return this.buff.slice(0, this.offset);
    }

    public getResultLength(): number {
        return this.offset;
    }

    public reset(): void {
        this.offset = 0;
    }

    public jump(length: number): void {
        if (length < -this.offset || length > this.getRemainderLength()) {
            throw new Error("Jump over buffer boundary.");
        }

        this.offset += length;
    }

    public writeInt8(value: number): void {
        this.offset = this.buff.writeInt8(value, this.offset);
    }

    public writeInt16BE(value: number): void {
        this.offset = this.buff.writeInt16BE(value, this.offset);
    }

    public writeInt16LE(value: number): void {
        this.offset = this.buff.writeInt16LE(value, this.offset);
    }

    public writeInt32BE(value: number): void {
        this.offset = this.buff.writeInt32BE(value, this.offset);
    }

    public writeInt32LE(value: number): void {
        this.offset = this.buff.writeInt32LE(value, this.offset);
    }

    public writeBigInt64BE(value: bigint): void {
        this.offset = this.buff.writeBigInt64BE(value, this.offset);
    }

    public writeBigInt64LE(value: bigint): void {
        this.offset = this.buff.writeBigInt64LE(value, this.offset);
    }

    public writeUInt8(value: number): void {
        this.offset = this.buff.writeUInt8(value, this.offset);
    }

    public writeUInt16BE(value: number): void {
        this.offset = this.buff.writeUInt16BE(value, this.offset);
    }

    public writeUInt16LE(value: number): void {
        this.offset = this.buff.writeUInt16LE(value, this.offset);
    }

    public writeUInt32BE(value: number): void {
        this.offset = this.buff.writeUInt32BE(value, this.offset);
    }

    public writeUInt32LE(value: number): void {
        this.offset = this.buff.writeUInt32LE(value, this.offset);
    }

    public writeBigUInt64BE(value: bigint): void {
        this.offset = this.buff.writeBigUInt64BE(value, this.offset);
    }

    public writeBigUInt64LE(value: bigint): void {
        this.offset = this.buff.writeBigUInt64LE(value, this.offset);
    }

    public writeBuffer(value: Buffer): void {
        if (value.length > this.getRemainderLength()) {
            throw new Error("Write over buffer boundary.");
        }

        this.offset += value.copy(this.buff, this.offset);
    }

    public readInt8(): number {
        const value = this.buff.readInt8(this.offset);
        this.offset += 1;
        return value;
    }

    public readInt16BE(): number {
        const value = this.buff.readInt16BE(this.offset);
        this.offset += 2;
        return value;
    }

    public readInt16LE(): number {
        const value = this.buff.readInt16LE(this.offset);
        this.offset += 2;
        return value;
    }

    public readInt32BE(): number {
        const value = this.buff.readInt32BE(this.offset);
        this.offset += 4;
        return value;
    }

    public readInt32LE(): number {
        const value = this.buff.readInt32LE(this.offset);
        this.offset += 4;
        return value;
    }

    public readBigInt64BE(): bigint {
        const value = this.buff.readBigInt64BE(this.offset);
        this.offset += 8;
        return value;
    }

    public readBigInt64LE(): bigint {
        const value = this.buff.readBigInt64LE(this.offset);
        this.offset += 8;
        return value;
    }

    public readUInt8(): number {
        const value = this.buff.readUInt8(this.offset);
        this.offset += 1;
        return value;
    }

    public readUInt16BE(): number {
        const value = this.buff.readUInt16BE(this.offset);
        this.offset += 2;
        return value;
    }

    public readUInt16LE(): number {
        const value = this.buff.readUInt16LE(this.offset);
        this.offset += 2;
        return value;
    }

    public readUInt32BE(): number {
        const value = this.buff.readUInt32BE(this.offset);
        this.offset += 4;
        return value;
    }

    public readUInt32LE(): number {
        const value = this.buff.readUInt32LE(this.offset);
        this.offset += 4;
        return value;
    }

    public readBigUInt64BE(): bigint {
        const value = this.buff.readBigUInt64BE(this.offset);
        this.offset += 8;
        return value;
    }

    public readBigUInt64LE(): bigint {
        const value = this.buff.readBigUInt64LE(this.offset);
        this.offset += 8;
        return value;
    }

    public readBuffer(length: number): Buffer {
        if (length > this.getRemainderLength()) {
            throw new Error("Read over buffer boundary.");
        }

        const value = this.buff.slice(this.offset, this.offset + length);
        this.offset += length;
        return value;
    }
}
