import "jest-extended";

import { httpie } from "@arkecosystem/core-utils";
import { Managers, Utils } from "@arkecosystem/crypto";
import nock from "nock";
import { MultiPaymentCommand } from "../../../../../packages/core-tester-cli/src/commands/send/multi-payment";
import { arkToSatoshi, captureTransactions, toFlags } from "../../shared";
import { nodeStatusResponse } from "./fixtures";

beforeEach(() => {
    // Just passthru. We'll test the Command class logic in its own test file more thoroughly
    nock("http://localhost:4003")
        .get("/api/node/configuration")
        .thrice()
        .reply(200, { data: { constants: {} } });

    nock("http://localhost:4003")
        .get("/api/node/configuration/crypto")
        .thrice()
        .reply(200, { data: Managers.configManager.getPreset("unitnet") });

    nock("http://localhost:4003")
        .get("/api/node/status")
        .thrice()
        .reply(200, nodeStatusResponse);

    jest.spyOn(httpie, "get");
    jest.spyOn(httpie, "post");
});

afterEach(() => {
    nock.cleanAll();
    jest.restoreAllMocks();
});

describe("Commands - Multipayment", () => {
    it("should apply multipayment transactions", async () => {
        const opts = {
            recipients:
                "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd,AMUN4qrRt1fAsdMXD3knHoBvy6SZ7hZtR2,AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C",
            amounts: "100,200,300",
            multipaymentFee: 2,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await MultiPaymentCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);

        expectedTransactions
            .filter(tx => tx.type === 7)
            .map(tx => {
                expect(tx.fee).toEqual(arkToSatoshi(opts.multipaymentFee));
                expect(tx.asset.payments).toEqual([
                    {
                        recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
                        amount: Utils.BigNumber.make("100"),
                    },
                    {
                        recipientId: "AMUN4qrRt1fAsdMXD3knHoBvy6SZ7hZtR2",
                        amount: Utils.BigNumber.make("200"),
                    },
                    {
                        recipientId: "AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C",
                        amount: Utils.BigNumber.make("300"),
                    },
                ]);
            });
    });

    it("should apply multipayment transactions with default fee when none specified", async () => {
        const opts = {
            recipients:
                "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd,AMUN4qrRt1fAsdMXD3knHoBvy6SZ7hZtR2,AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C",
            amounts: "100,200,300",
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await MultiPaymentCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);

        expectedTransactions
            .filter(tx => tx.type === 7)
            .map(tx => {
                expect(tx.fee).toEqual(arkToSatoshi(0.1));
                expect(tx.asset.payments).toEqual([
                    {
                        recipientId: "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd",
                        amount: Utils.BigNumber.make("100"),
                    },
                    {
                        recipientId: "AMUN4qrRt1fAsdMXD3knHoBvy6SZ7hZtR2",
                        amount: Utils.BigNumber.make("200"),
                    },
                    {
                        recipientId: "AW5wtiimZntaNvxH6QBi7bBpH2rDtFeD8C",
                        amount: Utils.BigNumber.make("300"),
                    },
                ]);
            });
    });
});
