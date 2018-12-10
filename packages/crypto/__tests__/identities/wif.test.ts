import "jest-extended";

import { WIF } from "../../src/identities/wif";
import { data, passphrase } from "./fixture.json";

describe("Identities - WIF", () => {
    describe("fromPassphrase", () => {
        it("should be a function", () => {
            expect(WIF.fromPassphrase).toBeFunction();
        });

        it("should be OK", () => {
            expect(WIF.fromPassphrase(passphrase)).toBe(data.wif);
        });
    });
});
