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

    public readInt8(): number {
        const value = this.buffer.readInt8(this.offset);
        this.offset += 1;
        return value;
    }
}
