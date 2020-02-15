import "jest-extended";

import { httpie } from "@arkecosystem/core-utils";
import { Enums, Managers } from "@arkecosystem/crypto";
import nock from "nock";
import { HtlcRefundCommand } from "../../../../../packages/core-tester-cli/src/commands/send/htlc-refund";
import { arkToSatoshi, captureTransactions, toFlags } from "../../shared";
import { nodeStatusResponse } from "./fixtures";

beforeEach(() => {
    // Just passthru. We'll test the Command class logic in its own test file more thoroughly
    nock("http://localhost:4003")
        .get("/api/node/configuration")
        .times(6)
        .reply(200, { data: { constants: {} } });

    nock("http://localhost:4003")
        .get("/api/node/configuration/crypto")
        .times(6)
        .reply(200, { data: Managers.configManager.getPreset("unitnet") });

    nock("http://localhost:4003")
        .get("/api/node/status")
        .times(6)
        .reply(200, nodeStatusResponse);

    jest.spyOn(httpie, "get");
    jest.spyOn(httpie, "post");
});

afterEach(() => {
    nock.cleanAll();
    jest.restoreAllMocks();
});

describe("Commands - Htlc refund", () => {
    it("should apply htlc refund transactions", async () => {
        const opts = {
            number: 1,
            htlcRefundFee: 0.2,
            amount: arkToSatoshi(12),
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await HtlcRefundCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(3);

        expectedTransactions
            .filter(tx => tx.type === Enums.TransactionType.HtlcRefund)
            .map(tx => {
                expect(tx.fee).toEqual(arkToSatoshi(opts.htlcRefundFee));
                expect(tx.asset.refund.lockTransactionId).toBeDefined();
            });
    });

    it("should apply htlc refund transactions with default fee when none specified", async () => {
        const opts = {
            number: 1,
            amount: arkToSatoshi(12),
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await HtlcRefundCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(3);

        expectedTransactions
            .filter(tx => tx.type === Enums.TransactionType.HtlcRefund)
            .map(tx => {
                expect(tx.fee).toEqual(arkToSatoshi(0.1));
                expect(tx.asset.refund.lockTransactionId).toBeDefined();
            });
    });
});
