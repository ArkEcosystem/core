import "jest-extended";

import { httpie } from "@arkecosystem/core-utils";
import { Enums, Identities, Managers } from "@arkecosystem/crypto";
import nock from "nock";
import { HtlcClaimCommand } from "../../../../../packages/core-tester-cli/src/commands/send/htlc-claim";
import { arkToSatoshi, captureTransactions, toFlags } from "../../shared";

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

    jest.spyOn(httpie, "get");
    jest.spyOn(httpie, "post");
});

afterEach(() => {
    nock.cleanAll();
    jest.restoreAllMocks();
});

describe("Commands - Htlc claim", () => {
    it("should apply htlc claim transactions", async () => {
        const opts = {
            number: 1,
            htlcClaimFee: 0.2,
            amount: arkToSatoshi(12),
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await HtlcClaimCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(3);

        expectedTransactions
            .filter(tx => tx.type === Enums.TransactionTypes.HtlcClaim)
            .map(tx => {
                expect(tx.fee).toEqual(arkToSatoshi(opts.htlcClaimFee));
                expect(tx.asset.claim.unlockSecret).toEqual(
                    Identities.Address.fromPublicKey(tx.senderPublicKey).slice(0, 32),
                );
                expect(tx.asset.claim.lockTransactionId).toBeDefined();
            });
    });

    it("should apply htlc claim transactions with default fee when none specified", async () => {
        const opts = {
            number: 1,
            amount: arkToSatoshi(12),
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await HtlcClaimCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(3);

        expectedTransactions
            .filter(tx => tx.type === Enums.TransactionTypes.HtlcClaim)
            .map(tx => {
                expect(tx.fee).toEqual(arkToSatoshi(0.1));
                expect(tx.asset.claim.unlockSecret).toEqual(
                    Identities.Address.fromPublicKey(tx.senderPublicKey).slice(0, 32),
                );
                expect(tx.asset.claim.lockTransactionId).toBeDefined();
            });
    });
});
