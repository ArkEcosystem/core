import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";

import { data, passphrase } from "./fixture.json";

let WIF;

beforeAll(() => {
    const crypto = CryptoManager.createFromPreset("devnet");
    WIF = crypto.identities.wif;
});

describe("Identities - WIF", () => {
    describe("fromPassphrase", () => {
        it("should be OK", () => {
            expect(WIF.fromPassphrase(passphrase)).toBe(data.wif);
        });
    });
});
