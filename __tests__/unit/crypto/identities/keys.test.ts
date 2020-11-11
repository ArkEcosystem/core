import "jest-extended";

import { Errors } from "@arkecosystem/crypto-identities";
import wif from "wif";

import { Address } from "../../../../packages/crypto/src/identities/address";
import { Keys } from "../../../../packages/crypto/src/identities/keys";
import { data, passphrase } from "./fixture.json";

describe("Identities - Keys", () => {
    describe("fromPassphrase", () => {
        it("should return two keys in hex", () => {
            const keys = Keys.fromPassphrase("secret");

            expect(keys).toBeObject();
            expect(keys.publicKey).toMatch(keys.publicKey);
            expect(keys.privateKey).toMatch(keys.privateKey);
        });

        it("should return address", () => {
            const keys = Keys.fromPassphrase(passphrase);
            // @ts-ignore
            const address = Address.fromPublicKey(keys.publicKey.toString("hex"));
            expect(address).toBe(data.address);
        });
    });

    describe("fromPrivateKey", () => {
        it("should return two keys in hex", () => {
            const keys = Keys.fromPrivateKey(data.privateKey);

            expect(keys).toBeObject();
            expect(keys.publicKey).toMatch(data.publicKey);
            expect(keys.privateKey).toMatch(data.privateKey);
        });
    });

    describe("fromWIF", () => {
        it("should return two keys in hex", () => {
            const keys = Keys.fromWIF("SGq4xLgZKCGxs7bjmwnBrWcT4C1ADFEermj846KC97FSv1WFD1dA");

            expect(keys).toBeObject();
            expect(keys.publicKey).toMatch(data.publicKey);
            expect(keys.privateKey).toMatch(data.privateKey);
        });

        it("should return address", () => {
            const keys = Keys.fromWIF(data.wif);
            // @ts-ignore
            const address = Address.fromPublicKey(keys.publicKey.toString("hex"));
            expect(address).toBe(data.address);
        });

        it("should get keys from compressed WIF", () => {
            const keys = Keys.fromWIF("SAaaKsDdWMXP5BoVnSBLwTLn48n96UvG42WSUUooRv1HrEHmaSd4");

            expect(keys).toBeObject();
            expect(keys).toHaveProperty("publicKey");
            expect(keys).toHaveProperty("privateKey");
            expect(keys).toHaveProperty("compressed", true);
        });

        it("should get keys from uncompressed WIF", () => {
            const keys = Keys.fromWIF("6hgnAG19GiMUf75C43XteG2mC8esKTiX9PYbKTh4Gca9MELRWmg");

            expect(keys).toBeObject();
            expect(keys).toHaveProperty("publicKey");
            expect(keys).toHaveProperty("privateKey");
            expect(keys).toHaveProperty("compressed", false);
        });

        it("should fail with an invalid network version", () => {
            // @ts-ignore
            wif.decode = jest.fn(() => ({ version: 1 }));

            expect(() => {
                Keys.fromWIF("invalid");
            }).toThrow(Errors.NetworkVersionError);
        });
    });
});
