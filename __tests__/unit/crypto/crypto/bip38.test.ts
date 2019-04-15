import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import wif from "wif";
import { bip38 } from "../../../../packages/crypto/src/crypto";

import * as errors from "../../../../packages/crypto/src/errors";
import fixtures from "./fixtures/bip38.json";

describe("BIP38", () => {
    describe("decrypt", () => {
        fixtures.valid.forEach(fixture => {
            it(`should decrypt '${fixture.description}'`, () => {
                const result = bip38.decrypt(fixture.bip38, fixture.passphrase);
                expect(wif.encode(0x80, result.privateKey, result.compressed)).toEqual(fixture.wif);
            });
        });

        fixtures.invalid.verify.forEach(fixture => {
            it(`should not decrypt '${fixture.description}'`, () => {
                try {
                    bip38.decrypt(fixture.base58, "foobar");
                } catch (error) {
                    expect(error).toBeInstanceOf(errors[fixture.error.type] || Error);
                    expect(error.message).toEqual(fixture.error.message);
                }
            });
        });

        it("should throw if compression flag is different than 0xe0 0xc0", () => {
            jest.spyOn(bs58check, "decode").mockImplementation(() => {
                const byteBuffer = new ByteBuffer(512, true);
                byteBuffer.writeUint8(0x01);
                byteBuffer.writeUint8(0x42); // type
                byteBuffer.writeUint8(0x01); // flag

                const buffer: any = Buffer.from(byteBuffer.flip().toBuffer());
                // force length to be 39
                Object.defineProperty(buffer, "length", {
                    get: jest.fn(() => 39),
                    set: jest.fn(),
                });
                return buffer;
            });

            expect(() => bip38.decrypt("", "")).toThrow(errors.Bip38CompressionError);

            jest.restoreAllMocks();
        });
    });

    describe("encrypt", () => {
        fixtures.valid.forEach(fixture => {
            if (fixture.decryptOnly) {
                return;
            }

            it(`should encrypt '${fixture.description}'`, () => {
                const buffer = bs58check.decode(fixture.wif);
                const actual = bip38.encrypt(buffer.slice(1, 33), !!buffer[33], fixture.passphrase);
                expect(actual).toEqual(fixture.bip38);
            });
        });

        it("should throw if private key buffer length is different than 32", () => {
            const byteBuffer = new ByteBuffer(512, true);
            byteBuffer.writeUint8(0x01);
            const buffer = Buffer.from(byteBuffer.toBuffer());

            expect(() => bip38.encrypt(buffer, true, "")).toThrow(errors.PrivateKeyLengthError);
        });
    });

    describe("verify", () => {
        fixtures.valid.forEach(fixture => {
            it(`should verify '${fixture.bip38}'`, () => {
                expect(bip38.verify(fixture.bip38)).toBeTrue();
            });
        });

        fixtures.invalid.verify.forEach(fixture => {
            it(`should not verify '${fixture.description}'`, () => {
                expect(bip38.verify(fixture.base58)).toBeFalse();
            });
        });

        it("should return false if encrypted WIF flag is different than 0xc0 0xe0", () => {
            jest.spyOn(bs58check, "decodeUnsafe").mockImplementation(() => {
                const byteBuffer = new ByteBuffer(512, true);
                byteBuffer.writeUint8(0x01);
                byteBuffer.writeUint8(0x42); // type
                byteBuffer.writeUint8(0x01); // flag

                const buffer: any = Buffer.from(byteBuffer.flip().toBuffer());
                Object.defineProperty(buffer, "length", {
                    get: jest.fn(() => 39),
                    set: jest.fn(),
                });
                return buffer;
            });

            expect(bip38.verify("yo")).toBeFalse();

            jest.restoreAllMocks();
        });

        it("should return false if encrypted EC mult flag is different than 0x24", () => {
            jest.spyOn(bs58check, "decodeUnsafe").mockImplementation(() => {
                const byteBuffer = new ByteBuffer(512, true);
                byteBuffer.writeUint8(0x01);
                byteBuffer.writeUint8(0x43); // type
                byteBuffer.writeUint8(0x01); // flag

                const buffer: any = Buffer.from(byteBuffer.flip().toBuffer());
                Object.defineProperty(buffer, "length", {
                    get: jest.fn(() => 39),
                    set: jest.fn(),
                });
                return buffer;
            });

            expect(bip38.verify("yo")).toBeFalse();

            jest.restoreAllMocks();
        });
    });
});
