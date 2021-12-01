export class ByteBuffer {
    private readonly buffer: Buffer;
    private offset = 0;

    public constructor(buffer: Buffer) {
        this.buffer = buffer;
    }

    public getOffset() {
        return this.offset;
    }

    public reset(): void {
        this.offset = 0;
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
}
