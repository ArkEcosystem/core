import "jest-extended";

import { PrivateKey } from "../../src/identities/private-key";
import { data, passphrase } from "./fixture.json";

describe("Identities - Private Key", () => {
    describe("fromPassphrase", () => {
        it("should be a function", () => {
            expect(PrivateKey.fromPassphrase).toBeFunction();
        });

        it("should be OK", () => {
            expect(PrivateKey.fromPassphrase(passphrase)).toBe(data.privateKey);
        });
    });

    describe("fromWIF", () => {
        it("should be a function", () => {
            expect(PrivateKey.fromWIF).toBeFunction();
        });

        it("should be OK", () => {
            expect(PrivateKey.fromWIF(data.wif)).toBe(data.privateKey);
        });
    });
});
