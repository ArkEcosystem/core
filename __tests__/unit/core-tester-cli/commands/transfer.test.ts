import "jest-extended";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { TransferCommand } from "../../../../packages/core-tester-cli/src/commands/transfer";
import { arkToSatoshi } from "../../../../packages/core-tester-cli/src/utils";
import { toFlags } from "../shared";

const mockAxios = new MockAdapter(axios);

beforeEach(() => {
    // Just passthru. We'll test the Command class logic in its own test file more thoroughly
    mockAxios.onGet("http://localhost:4003/api/v2/node/configuration").reply(200, { data: { constants: {} } });
    mockAxios.onGet("http://localhost:4000/config").reply(200, { data: { network: {} } });

    jest.spyOn(axios, "post");
});

afterEach(() => {
    mockAxios.reset();
});

afterAll(() => mockAxios.restore());

describe("Commands - Transfer", () => {
    it("should postTransactions using custom smartBridge value", async () => {
        const expectedRecipientId = "DFyUhQW52sNB5PZdS7VD9HknwYrSNHPQDq";
        const expectedTransactionAmount = 2;
        const expectedFee = arkToSatoshi(0.1);
        const opts = {
            amount: expectedTransactionAmount,
            transferFee: expectedFee,
            number: 1,
            smartBridge: "foo bar",
            recipient: expectedRecipientId,
        };

        mockAxios.onPost("http://localhost:4003/api/v2/transactions").reply(200, { data: {} });
        let expectedTransactions = [];
        // @ts-ignore
        jest.spyOn(axios, "post").mockImplementation((uri, { transactions }) => {
            expectedTransactions = transactions;
        });

        const flags = toFlags(opts);
        await TransferCommand.run(flags);

        expect(expectedTransactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    vendorField: "foo bar",
                    amount: arkToSatoshi(expectedTransactionAmount),
                    fee: arkToSatoshi(expectedFee),
                    recipientId: expectedRecipientId,
                }),
            ]),
        );
    });

    it("should generate n transactions", async () => {
        const expectedTxCount = 5;
        const expectedRecipientId = "DFyUhQW52sNB5PZdS7VD9HknwYrSNHPQDq";
        const opts = {
            amount: arkToSatoshi(2),
            transferFee: arkToSatoshi(2),
            number: expectedTxCount,
            recipient: expectedRecipientId,
        };

        mockAxios.onPost("http://localhost:4003/api/v2/transactions").reply(200, { data: {} });
        let expectedTransactions = [];
        // @ts-ignore
        jest.spyOn(axios, "post").mockImplementation((uri, { transactions }) => {
            expectedTransactions = transactions;
        });

        const flags = toFlags(opts);
        await TransferCommand.run(flags);

        expect(expectedTransactions).toHaveLength(expectedTxCount);
        for (const t of expectedTransactions) {
            expect(t.vendorField).toMatch(/Transaction \d/);
            expect(t.amount).toBeDefined();
            expect(t.fee).toBeDefined();
        }
    });

    it("should send n transactions to specified recipient", async () => {
        const expectedTxCount = 10;
        const expectedRecipientId = "DFyUhQW52sNB5PZdS7VD9HknwYrSNHPQDq";
        const opts = {
            amount: arkToSatoshi(2),
            transferFee: arkToSatoshi(0.1),
            number: expectedTxCount,
            recipient: expectedRecipientId,
        };

        mockAxios.onPost("http://localhost:4003/api/v2/transactions").reply(200, { data: {} });
        let expectedTransactions = [];
        // @ts-ignore
        jest.spyOn(axios, "post").mockImplementation((uri, { transactions }) => {
            expectedTransactions = transactions;
        });

        const flags = toFlags(opts);
        await TransferCommand.run(flags);

        expect(expectedTransactions).toHaveLength(expectedTxCount);
        for (const t of expectedTransactions) {
            expect(t.recipientId).toEqual(expectedRecipientId);
        }
    });

    it("should sign with 2nd passphrase if specified", async () => {
        const expectedTransactionAmount = arkToSatoshi(2);
        const expectedFee = arkToSatoshi(0.1);
        const expectedRecipientId = "DFyUhQW52sNB5PZdS7VD9HknwYrSNHPQDq";

        const opts = {
            amount: expectedTransactionAmount,
            transferFee: expectedFee,
            number: 1,
            secondPassphrase: "she sells sea shells down by the sea shore",
            recipient: expectedRecipientId,
        };

        mockAxios.onPost("http://localhost:4003/api/v2/transactions").reply(200, { data: {} });
        let expectedTransactions = [];
        // @ts-ignore
        jest.spyOn(axios, "post").mockImplementation((uri, { transactions }) => {
            expectedTransactions = transactions;
        });

        const flags = toFlags(opts);
        await TransferCommand.run(flags);

        expect(expectedTransactions).toHaveLength(1);
        for (const t of expectedTransactions) {
            expect(t.secondSignature).toBeDefined();
            expect(t.signSignature).toEqual(t.secondSignature);
        }
    });
});
