import "jest-extended";

import { httpie } from "@arkecosystem/core-utils";
import { Managers } from "@arkecosystem/crypto";
import nock from "nock";
import { TransferCommand } from "../../../../../packages/core-tester-cli/src/commands/send/transfer";
import { arkToSatoshi, captureTransactions, expectTransactions, toFlags } from "../../shared";
import { nodeStatusResponse } from "./fixtures";

beforeEach(() => {
    // Just passthru. We'll test the Command class logic in its own test file more thoroughly
    nock("http://localhost:4003")
        .get("/api/node/configuration")
        .twice()
        .reply(200, { data: { constants: {} } });

    nock("http://localhost:4003")
        .get("/api/node/configuration/crypto")
        .twice()
        .reply(200, { data: Managers.configManager.getPreset("unitnet") });

    nock("http://localhost:4003")
        .get("/api/node/status")
        .twice()
        .reply(200, nodeStatusResponse);

    jest.spyOn(httpie, "post");
});

afterEach(() => {
    nock.cleanAll();
});

describe("Commands - Transfer", () => {
    it("should postTransactions using custom smartBridge value", async () => {
        const expectedRecipientId = "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff";
        const expectedTransactionAmount = 2;
        const expectedFee = 0.1;
        const opts = {
            amount: expectedTransactionAmount,
            transferFee: expectedFee,
            number: 1,
            vendorField: "foo bar",
            recipient: expectedRecipientId,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await TransferCommand.run(toFlags(opts));

        expectTransactions(expectedTransactions, {
            vendorField: "foo bar",
            amount: arkToSatoshi(expectedTransactionAmount),
            fee: arkToSatoshi(expectedFee),
            recipientId: expectedRecipientId,
        });
    });

    it("should generate n transactions", async () => {
        const expectedTxCount = 5;
        const expectedRecipientId = "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff";
        const opts = {
            amount: 2,
            transferFee: 2,
            number: expectedTxCount,
            recipient: expectedRecipientId,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await TransferCommand.run(toFlags(opts));

        expect(expectedTransactions).toHaveLength(expectedTxCount);
        for (const t of expectedTransactions) {
            expect(t.vendorField).toMatch(/Transaction \d/);
            expect(t.amount).toBeDefined();
            expect(t.fee).toBeDefined();
        }
    });

    it("should send n transactions to specified recipient", async () => {
        const expectedTxCount = 10;
        const expectedRecipientId = "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff";
        const opts = {
            amount: 2,
            transferFee: 0.1,
            number: expectedTxCount,
            recipient: expectedRecipientId,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await TransferCommand.run(toFlags(opts));

        expect(expectedTransactions).toHaveLength(expectedTxCount);
        for (const t of expectedTransactions) {
            expect(t.recipientId).toEqual(expectedRecipientId);
        }
    });

    it("should sign with 2nd passphrase if specified", async () => {
        const expectedTransactionAmount = 2;
        const expectedFee = 0.1;
        const expectedRecipientId = "AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff";

        const opts = {
            amount: expectedTransactionAmount,
            transferFee: expectedFee,
            number: 1,
            secondPassphrase: "she sells sea shells down by the sea shore",
            recipient: expectedRecipientId,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await TransferCommand.run(toFlags(opts));

        expect(expectedTransactions).toHaveLength(1);
        for (const transaction of expectedTransactions) {
            expect(transaction.secondSignature).toBeDefined();
        }
    });
});
