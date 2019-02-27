import "jest-extended";

import { VerifyCommand } from "../../../../packages/core-debugger-cli/src/commands/verify";

describe("Commands - Verify", () => {
    const fixtureBlock = require("../__fixtures__/block.json");
    const fixtureTransaction = require("../__fixtures__/transaction.json");

    it("should verify a block", async () => {
        expect(await VerifyCommand.run(["--data", fixtureBlock.serializedFull, "--type", "block"])).toBeTrue();
    });

    it("should verify a transaction", async () => {
        expect(await VerifyCommand.run(["--data", fixtureTransaction.serialized, "--type", "transaction"])).toBeTrue();
    });
});
