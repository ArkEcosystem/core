import { ByteBuffer } from "@packages/crypto/src/byte-buffer";
import { Buffer } from "buffer";

describe("ByteBuffer", () => {
    describe("Int8", () => {
        const bufferSize = 1;
        const min = -128;
        const max = 127;
        const validValues = [min, max];
        const invalidValues = [min - 1, max + 1];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeInt8(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readInt8()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeInt8(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("UInt8", () => {
        const bufferSize = 1;
        const min = 0;
        const max = 255;
        const validValues = [min, max];
        const invalidValues = [min - 1, max + 1];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeUInt8(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readUInt8()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeUInt8(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("Int16BE", () => {
        const bufferSize = 2;
        const min = -32768;
        const max = 32767;
        const validValues = [min, max];
        const invalidValues = [min - 1, max + 1];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeInt16BE(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readInt16BE()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeInt16BE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("UInt16BE", () => {
        const bufferSize = 2;
        const min = 0;
        const max = 65535;
        const validValues = [min, max];
        const invalidValues = [min - 1, max + 1];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeUInt16BE(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readUInt16BE()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeUInt16BE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("Int16LE", () => {
        const bufferSize = 2;
        const min = -32768;
        const max = 32767;
        const validValues = [min, max];
        const invalidValues = [min - 1, max + 1];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeInt16LE(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readInt16LE()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeInt16LE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("UInt16LE", () => {
        const bufferSize = 2;
        const min = 0;
        const max = 65535;
        const validValues = [min, max];
        const invalidValues = [min - 1, max + 1];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeUInt16LE(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readUInt16LE()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeUInt16LE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("Int32BE", () => {
        const bufferSize = 4;
        const min = -2147483648;
        const max = 2147483647;
        const validValues = [min, max];
        const invalidValues = [min - 1, max + 1];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeInt32BE(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readInt32BE()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeInt32BE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("UInt32BE", () => {
        const bufferSize = 4;
        const min = 0;
        const max = 4294967295;
        const validValues = [min, max];
        const invalidValues = [min - 1, max + 1];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeUInt32BE(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readUInt32BE()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeUInt32BE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("Int32LE", () => {
        const bufferSize = 4;
        const min = -2147483648;
        const max = 2147483647;
        const validValues = [min, max];
        const invalidValues = [min - 1, max + 1];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeInt32LE(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readInt32LE()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeInt32LE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("UInt32LE", () => {
        const bufferSize = 4;
        const min = 0;
        const max = 4294967295;
        const validValues = [min, max];
        const invalidValues = [min - 1, max + 1];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeUInt32LE(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readUInt32LE()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeUInt32LE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= ${min} and <= ${max}. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("Int64BE", () => {
        const bufferSize = 8;
        const min = -9223372036854775808n;
        const max = 9223372036854775807n;
        const validValues = [min, max];
        const invalidValues = [min - 1n, max + 1n];

        it.each(validValues)("should write and read value: %s", (value: bigint) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeBigInt64BE(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readBigInt64BE()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: bigint) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeBigInt64BE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= -(2n ** 63n) and < 2n ** 63n. Received ${value
                        .toLocaleString()
                        .replace(new RegExp(",", "g"), "_")}n`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("Int64LE", () => {
        const bufferSize = 8;
        const min = -9223372036854775808n;
        const max = 9223372036854775807n;
        const validValues = [min, max];
        const invalidValues = [min - 1n, max + 1n];

        it.each(validValues)("should write and read value: %s", (value: bigint) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeBigInt64LE(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readBigInt64LE()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: bigint) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeBigInt64BE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= -(2n ** 63n) and < 2n ** 63n. Received ${value
                        .toLocaleString()
                        .replace(new RegExp(",", "g"), "_")}n`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });
});
