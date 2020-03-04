import "jest-extended";

import { base58 } from "bstring";
import ByteBuffer from "bytebuffer";
import wif from "wif";

import { bip38 } from "../../../../packages/crypto/src/crypto";
import * as errors from "../../../../packages/crypto/src/errors";
import { Base58 } from "../../../../packages/crypto/src/utils";
import fixtures from "./fixtures/bip38.json";

describe("BIP38", () => {
    describe("decrypt", () => {
        for (const fixture of fixtures.valid) {
            it(`should decrypt '${fixture.description}'`, () => {
                const result = bip38.decrypt(fixture.bip38, fixture.passphrase);
                expect(wif.encode(0x80, result.privateKey, result.compressed)).toEqual(fixture.wif);
            });
        }

        for (const fixture of fixtures.invalid.verify) {
            it(`should not decrypt '${fixture.description}'`, () => {
                try {
                    bip38.decrypt(fixture.base58, "foobar");
                } catch (error) {
                    expect(error).toBeInstanceOf(errors[fixture.error.type] || Error);
                    expect(error.message).toEqual(fixture.error.message);
                }
            });
        }

        it("should throw if compression flag is different than 0xe0 0xc0", () => {
            jest.spyOn(Base58, "decodeCheck").mockImplementation(() => {
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
        for (const fixture of fixtures.valid) {
            if (fixture.decryptOnly) {
                return;
            }

            it(`should encrypt '${fixture.description}'`, () => {
                const buffer = Base58.decodeCheck(fixture.wif);
                const actual = bip38.encrypt(buffer.slice(1, 33), !!buffer[33], fixture.passphrase);
                expect(actual).toEqual(fixture.bip38);
            });
        }

        it("should throw if private key buffer length is different than 32", () => {
            const byteBuffer = new ByteBuffer(512, true);
            byteBuffer.writeUint8(0x01);
            const buffer = Buffer.from(byteBuffer.toBuffer());

            expect(() => bip38.encrypt(buffer, true, "")).toThrow(errors.PrivateKeyLengthError);
        });
    });

    describe("verify", () => {
        for (const fixture of fixtures.valid) {
            it(`should verify '${fixture.bip38}'`, () => {
                expect(bip38.verify(fixture.bip38)).toBeTrue();
            });
        }

        for (const fixture of fixtures.invalid.verify) {
            it(`should not verify '${fixture.description}'`, () => {
                expect(bip38.verify(fixture.base58)).toBeFalse();
            });
        }

        it("should return false if encrypted WIF flag is different than 0xc0 0xe0", () => {
            jest.spyOn(base58, "decode").mockImplementation(() => {
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
            jest.spyOn(base58, "decode").mockImplementation(() => {
                const byteBuffer = new ByteBuffer(512, true);
                byteBuffer.writeUint8(0x01);
                byteBuffer.writeUint8(0x43); // type
                byteBuffer.writeUint8(0x01); // flag

                const buffer: any = Buffer.from(byteBuffer.flip().toBuffer());
                Object.defineProperty(buffer, "length", {
                    get: jest.fn(() => 43),
                    set: jest.fn(),
                });
                return buffer;
            });

            expect(bip38.verify("yo")).toBeFalse();

            jest.restoreAllMocks();
        });
    });
});
