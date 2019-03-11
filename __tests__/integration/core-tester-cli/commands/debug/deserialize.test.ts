import "jest-extended";

import { DeserializeCommand } from "../../../../../packages/core-tester-cli/src/commands/debug/deserialize";

describe("Commands - Deserialize", () => {
    const fixtureBlock = require("../../__fixtures__/block.json");
    const fixtureTransaction = require("../../__fixtures__/transaction.json");

    it("should deserialize a block (not-full)", async () => {
        const actual = JSON.parse(
            await DeserializeCommand.run(["--data", fixtureBlock.serialized, "--type", "block", "--network", "devnet"]),
        );

        expect(actual.data.version).toBe(fixtureBlock.data.version);
        expect(actual.data.timestamp).toBe(fixtureBlock.data.timestamp);
        expect(actual.data.height).toBe(fixtureBlock.data.height);
        expect(actual.data.previousBlock).toBe(fixtureBlock.data.previousBlock);
        expect(actual.data.numberOfTransactions).toBe(fixtureBlock.data.numberOfTransactions);
        expect(actual.data.totalAmount).toBe(fixtureBlock.data.totalAmount);
        expect(actual.data.totalFee).toBe(fixtureBlock.data.totalFee);
        expect(actual.data.reward).toBe(fixtureBlock.data.reward);
        expect(actual.data.payloadLength).toBe(fixtureBlock.data.payloadLength);
        expect(actual.data.payloadHash).toBe(fixtureBlock.data.payloadHash);
        expect(actual.data.generatorPublicKey).toBe(fixtureBlock.data.generatorPublicKey);
        expect(actual.data.blockSignature).toBe(fixtureBlock.data.blockSignature);
    });

    it("should deserialize a block (full)", async () => {
        const actual = JSON.parse(
            await DeserializeCommand.run([
                "--data",
                fixtureBlock.serializedFull,
                "--type",
                "block",
                "--network",
                "devnet",
            ]),
        );

        expect(actual.data.version).toBe(fixtureBlock.data.version);
        expect(actual.data.timestamp).toBe(fixtureBlock.data.timestamp);
        expect(actual.data.height).toBe(fixtureBlock.data.height);
        expect(actual.data.previousBlock).toBe(fixtureBlock.data.previousBlock);
        expect(actual.data.numberOfTransactions).toBe(fixtureBlock.data.numberOfTransactions);
        expect(actual.data.totalAmount).toBe(fixtureBlock.data.totalAmount);
        expect(actual.data.totalFee).toBe(fixtureBlock.data.totalFee);
        expect(actual.data.reward).toBe(fixtureBlock.data.reward);
        expect(actual.data.payloadLength).toBe(fixtureBlock.data.payloadLength);
        expect(actual.data.payloadHash).toBe(fixtureBlock.data.payloadHash);
        expect(actual.data.generatorPublicKey).toBe(fixtureBlock.data.generatorPublicKey);
        expect(actual.data.blockSignature).toBe(fixtureBlock.data.blockSignature);
        expect(actual.transactions).toHaveLength(7);
    });

    it("should deserialize a transaction", async () => {
        const actual = JSON.parse(
            await DeserializeCommand.run([
                "--data",
                fixtureTransaction.serialized,
                "--type",
                "transaction",
                "--network",
                "devnet",
            ]),
        );

        expect(actual.type).toBe(fixtureTransaction.data.type);
        expect(+actual.amount).toBe(fixtureTransaction.data.amount);
        expect(+actual.fee).toBe(fixtureTransaction.data.fee);
        expect(actual.recipientId).toBe(fixtureTransaction.data.recipientId);
        expect(actual.timestamp).toBe(fixtureTransaction.data.timestamp);
        expect(actual.senderPublicKey).toBe(fixtureTransaction.data.senderPublicKey);
        expect(actual.signature).toBe(fixtureTransaction.data.signature);
        expect(actual.id).toBe(fixtureTransaction.data.id);
    });
});
