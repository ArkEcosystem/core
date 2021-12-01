import { ByteBuffer } from "@packages/crypto/src/byte-buffer";
import { Buffer } from "buffer";

describe("ByteBuffer", () => {
    describe("Int8", () => {
        const validValues = [-128, 0, 1, 127];
        const invalidValues = [-129, 128];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(1);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeInt8(value);
            expect(byteBuffer.getOffset()).toEqual(1);

            byteBuffer.reset();
            expect(byteBuffer.readInt8()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(1);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(1);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeInt8(value);
            }).toThrowError(
                new RangeError(
                    `The value of "value" is out of range. It must be >= -128 and <= 127. Received ${value}`,
                ),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });

    describe("UInt8", () => {
        const validValues = [0, 1, 127, 255];
        const invalidValues = [-1, 256];

        it.each(validValues)("should write and read value: %s", (value: number) => {
            const buffer = Buffer.alloc(1);

            const byteBuffer = new ByteBuffer(buffer);

            byteBuffer.writeUInt8(value);
            expect(byteBuffer.getOffset()).toEqual(1);

            byteBuffer.reset();
            expect(byteBuffer.readUInt8()).toEqual(value);
            expect(byteBuffer.getOffset()).toEqual(1);
        });

        it.each(invalidValues)("should fail writing value: %s", (value: number) => {
            const buffer = Buffer.alloc(1);

            const byteBuffer = new ByteBuffer(buffer);

            expect(() => {
                byteBuffer.writeUInt8(value);
            }).toThrowError(
                new RangeError(`The value of "value" is out of range. It must be >= 0 and <= 255. Received ${value}`),
            );
            expect(byteBuffer.getOffset()).toEqual(0);
        });
    });
});
