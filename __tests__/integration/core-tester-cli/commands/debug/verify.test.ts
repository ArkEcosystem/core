import { VerifyCommand } from "../../../../../packages/core-tester-cli/src/commands/debug/verify";

describe("Commands - Verify", () => {
    const fixtureBlock = require("../../__fixtures__/block.json");
    const fixtureTransaction = require("../../__fixtures__/transaction.json");

    it("should verify a block", async () => {
        expect(
            await VerifyCommand.run(["--data", fixtureBlock.serializedFull, "--type", "block", "--network", "devnet"]),
        ).toBeTrue();
    });

    it("should verify a transaction", async () => {
        expect(
            await VerifyCommand.run([
                "--data",
                fixtureTransaction.serialized,
                "--type",
                "transaction",
                "--network",
                "devnet",
            ]),
        ).toBeTrue();
    });
});
