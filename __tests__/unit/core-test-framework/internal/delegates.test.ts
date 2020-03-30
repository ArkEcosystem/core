import "jest-extended";

import { delegates } from "@packages/core-test-framework/src/internal/delegates";

describe("Delegates", () => {
    it("should create delegates from passphrases", async () => {
        expect(delegates.length).toBeGreaterThan(1);
        delegates.forEach((delegate) => {
            expect(delegate.passphrase).toBeString();
            expect(delegate.address).toBeString();
            expect(delegate.publicKey).toBeString();
            expect(delegate.privateKey).toBeString();
            expect(delegate.wif).toBeString();
        });
    });
});
