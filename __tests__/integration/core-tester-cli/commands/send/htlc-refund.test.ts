import "jest-extended";

import { httpie } from "@arkecosystem/core-utils";
import { Enums, Managers } from "@arkecosystem/crypto";
import nock from "nock";
import { HtlcRefundCommand } from "../../../../../packages/core-tester-cli/src/commands/send/htlc-refund";
import { arkToSatoshi, captureTransactions, toFlags } from "../../shared";

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

    jest.spyOn(httpie, "get");
    jest.spyOn(httpie, "post");
});

afterEach(() => {
    nock.cleanAll();
    jest.restoreAllMocks();
});

describe("Commands - Htlc refund", () => {
    const lockTransactionId = "0b127468138499138c9498d356975c2aac194f5a6963a59d025d1e46fc29241a";
    it("should apply htlc refund transactions", async () => {
        const opts = {
            number: 1,
            htlcRefundFee: 0.2,
            lockTransactionId,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await HtlcRefundCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);

        expectedTransactions
            .filter(tx => tx.type === Enums.TransactionTypes.HtlcRefund)
            .map(tx => {
                expect(tx.fee).toEqual(arkToSatoshi(opts.htlcRefundFee));
                expect(tx.asset.refund.lockTransactionId).toEqual(lockTransactionId);
            });
    });

    it("should apply htlc refund transactions with default fee when none specified", async () => {
        const opts = {
            number: 1,
            amount: 12,
            lockTransactionId,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await HtlcRefundCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);

        expectedTransactions
            .filter(tx => tx.type === Enums.TransactionTypes.HtlcRefund)
            .map(tx => {
                expect(tx.fee).toEqual(arkToSatoshi(0.1));
                expect(tx.asset.refund.lockTransactionId).toEqual(lockTransactionId);
            });
    });
});
