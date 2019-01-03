import "jest-extended";

import bs58check from "bs58check";
import wif from "wif";
import { bip38 } from "../../src/crypto";

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
                    expect(error.message).toEqual(fixture.exception);
                }
            });
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
    });
});
