import "jest-extended";

import { VerifySecondSignatureCommand } from "../../src/commands/verify-second";

describe("Commands - Verify Second", () => {
    const fixtureTransaction = require("../__fixtures__/transaction-second.json");

    it("should verify a second signature", async () => {
        expect(
            await VerifySecondSignatureCommand.run([
                "--data",
                fixtureTransaction.serialized,
                "--publicKey",
                "03699e966b2525f9088a6941d8d94f7869964a000efe65783d78ac82e1199fe609",
            ]),
        ).toBeTrue();
    });
});
