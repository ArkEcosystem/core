import "jest-extended";

import { verify } from "../../src/commands/verify";

describe("Commands - Verify", () => {
    const fixtureBlock = require("../__fixtures__/block.json");
    const fixtureTransaction = require("../__fixtures__/transaction.json");

    it("should verify a block", () => {
        expect(
            verify({
                data: fixtureBlock.serializedFull,
                type: "block",
            }),
        ).toBeTrue();
    });

    it("should verify a transaction", () => {
        expect(
            verify({
                data: fixtureTransaction.serialized,
                type: "transaction",
            }),
        ).toBeTrue();
    });
});
