import "jest-extended";

import { SerializeCommand } from "../../src/commands/serialize";

describe("Commands - Serialize", () => {
    const fixtureBlock = require("../__fixtures__/block.json");
    const fixtureTransaction = require("../__fixtures__/transaction.json");

    it("should serialize a block (not-full)", async () => {
        expect(await SerializeCommand.run(["--data", JSON.stringify(fixtureBlock.data), "--type", "block"])).toEqual(
            fixtureBlock.serialized,
        );
    });

    it("should serialize a block (full)", async () => {
        expect(
            await SerializeCommand.run(["--data", JSON.stringify(fixtureBlock.data), "--type", "block", "--full"]),
        ).toEqual(fixtureBlock.serializedFull);
    });

    it("should serialize a transaction", async () => {
        expect(
            await SerializeCommand.run(["--data", JSON.stringify(fixtureTransaction.data), "--type", "transaction"]),
        ).toEqual(fixtureTransaction.serialized);
    });
});
