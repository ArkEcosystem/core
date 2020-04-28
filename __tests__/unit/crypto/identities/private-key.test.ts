import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

import { data, passphrase } from "./fixture.json";

let PrivateKey;

beforeAll(() => {
    const crypto = CryptoManager.createFromPreset("devnet");
    PrivateKey = crypto.identities.privateKey;
});

describe("Identities - Private Key", () => {
    describe("fromPassphrase", () => {
        it("should be OK", () => {
            expect(PrivateKey.fromPassphrase(passphrase)).toBe(data.privateKey);
        });
    });

    describe("fromWIF", () => {
        it("should be OK", () => {
            expect(PrivateKey.fromWIF(data.wif)).toBe(data.privateKey);
        });
    });
});
