import { ByteBuffer } from "@packages/crypto/src/utils";
import { Buffer } from "buffer";

describe("ByteBuffer", () => {
    describe("result", () => {
        it("should return valid result & result length", () => {
            const buffer = Buffer.alloc(2);
            const byteBuffer = new ByteBuffer(buffer);

            expect(byteBuffer.getResultLength()).toEqual(0);
            expect(Buffer.alloc(0).compare(byteBuffer.getResult())).toEqual(0);

            byteBuffer.writeInt8(1);

            expect(byteBuffer.getResultLength()).toEqual(1);
            const tmpBuffer1 = Buffer.alloc(1);
            tmpBuffer1.writeInt8(1);
            expect(tmpBuffer1.compare(byteBuffer.getResult())).toEqual(0);

            byteBuffer.writeInt8(2);

            expect(byteBuffer.getResultLength()).toEqual(2);
            const tmpBuffer2 = Buffer.alloc(2);
            tmpBuffer2.writeInt8(1);
            tmpBuffer2.writeInt8(2, 1);
            expect(tmpBuffer2.compare(byteBuffer.getResult())).toEqual(0);
        });
    });

    describe("reminder", () => {
        it("should return valid remainders and remainder length", () => {
            const buffer = Buffer.alloc(2);
            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeInt8(1);
            byteBuffer.writeInt8(2);
            byteBuffer.reset();

            expect(byteBuffer.getRemainderLength()).toEqual(2);
            const tmpBuffer1 = Buffer.alloc(2);
            tmpBuffer1.writeInt8(1);
            tmpBuffer1.writeInt8(2, 1);
            expect(tmpBuffer1.compare(byteBuffer.getRemainder())).toEqual(0);

            byteBuffer.readInt8();

            expect(byteBuffer.getRemainderLength()).toEqual(1);
            const tmpBuffer2 = Buffer.alloc(1);
            tmpBuffer2.writeInt8(2);
            expect(tmpBuffer2.compare(byteBuffer.getRemainder())).toEqual(0);

            byteBuffer.readInt8();

            expect(byteBuffer.getRemainderLength()).toEqual(0);
            expect(Buffer.alloc(0).compare(byteBuffer.getRemainder())).toEqual(0);
        });
    });

    describe("jump", () => {
        it("should jump", () => {
            const buffer = Buffer.alloc(1);
            const byteBuffer = new ByteBuffer(buffer);

            expect(byteBuffer.getResultLength()).toEqual(0);

            byteBuffer.jump(1);
            expect(byteBuffer.getResultLength()).toEqual(1);

            byteBuffer.jump(-1);
            expect(byteBuffer.getResultLength()).toEqual(0);
        });

        it("should throw error when jumping outside boundary", () => {
            const buffer = Buffer.alloc(1);
            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.jump(2);
            }).toThrowError("Jump over buffer boundary.");

            expect(() => {
                byteBuffer.jump(-1);
            }).toThrowError("Jump over buffer boundary.");
        });
    });

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
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readInt8()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
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
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readUInt8()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
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
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readInt16BE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
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
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readUInt16BE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
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
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readInt16LE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
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
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readUInt16LE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
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
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readInt32BE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
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
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readUInt32BE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
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
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readInt32LE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
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
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readUInt32LE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
        });
    });

    describe("BigInt64BE", () => {
        const bufferSize = 8;
        const min = -9223372036854775808n;
        const max = 9223372036854775807n;
        const validValues = [min, max];
        const invalidValues = [min - 1n, max + 1n];

        it.each(validValues)("should write and read value: %s", (value: bigint) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeBigInt64BE(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readBigInt64BE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
        });
    });

    describe("BigUInt64BE", () => {
        const bufferSize = 8;
        const min = 0n;
        const max = 18_446_744_073_709_551_615n;
        const validValues = [min, max];
        const invalidValues = [min - 1n, max + 1n];

        it.each(validValues)("should write and read value: %s", (value: bigint) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeBigUInt64BE(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readBigUInt64BE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: bigint) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeBigUInt64BE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= 0n and < 2n ** 64n. Received ${value
                        .toLocaleString()
                        .replace(new RegExp(",", "g"), "_")}n`,
                ),
            );
            expect(byteBuffer.getResultLength()).toEqual(0);
        });
    });

    describe("BigInt64LE", () => {
        const bufferSize = 8;
        const min = -9223372036854775808n;
        const max = 9223372036854775807n;
        const validValues = [min, max];
        const invalidValues = [min - 1n, max + 1n];

        it.each(validValues)("should write and read value: %s", (value: bigint) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeBigInt64LE(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readBigInt64LE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
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
            expect(byteBuffer.getResultLength()).toEqual(0);
        });
    });

    describe("BigUInt64LE", () => {
        const bufferSize = 8;
        const min = 0n;
        const max = 18_446_744_073_709_551_615n;
        const validValues = [min, max];
        const invalidValues = [min - 1n, max + 1n];

        it.each(validValues)("should write and read value: %s", (value: bigint) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeBigUInt64LE(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(byteBuffer.readBigUInt64LE()).toEqual(value);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: bigint) => {
            const buffer = Buffer.alloc(bufferSize);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeBigUInt64LE(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= 0n and < 2n ** 64n. Received ${value
                        .toLocaleString()
                        .replace(new RegExp(",", "g"), "_")}n`,
                ),
            );
            expect(byteBuffer.getResultLength()).toEqual(0);
        });
    });

    describe("buffer", () => {
        it("should write and read value", () => {
            const bufferSize = 5;
            const buffer = Buffer.alloc(bufferSize);
            const bufferToCompare = Buffer.alloc(bufferSize).fill(1);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeBuffer(bufferToCompare);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);

            byteBuffer.reset();
            expect(bufferToCompare.compare(byteBuffer.readBuffer(bufferSize))).toEqual(0);
            expect(byteBuffer.getResultLength()).toEqual(bufferSize);
        });

        it("should throw when writing over boundary", () => {
            const buffer = Buffer.alloc(5);
            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeBuffer(Buffer.alloc(6));
            }).toThrowError("Write over buffer boundary.");
        });

        it("should throw reading writing over boundary", () => {
            const buffer = Buffer.alloc(5);
            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.readBuffer(6);
            }).toThrowError("Read over buffer boundary.");
        });
    });
});
