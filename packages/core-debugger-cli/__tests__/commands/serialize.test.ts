import "jest-extended";

import { serialize } from "../../src/commands/serialize";

describe("Commands - Serialize", () => {
    const fixtureBlock = require("../__fixtures__/block.json");
    const fixtureTransaction = require("../__fixtures__/transaction.json");

    it("should serialize a block (not-full)", () => {
        expect(
            serialize({
                data: JSON.stringify(fixtureBlock.data),
                type: "block",
                full: false,
            }),
        ).toEqual(fixtureBlock.serialized);
    });

    it("should serialize a block (full)", () => {
        expect(
            serialize({
                data: JSON.stringify(fixtureBlock.data),
                type: "block",
                full: true,
            }),
        ).toEqual(fixtureBlock.serializedFull);
    });

    it("should serialize a transaction", () => {
        expect(
            serialize({
                data: JSON.stringify(fixtureTransaction.data),
                type: "transaction",
            }),
        ).toEqual(fixtureTransaction.serialized);
    });
});
