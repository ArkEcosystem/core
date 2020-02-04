import "jest-extended";

import { httpie } from "@arkecosystem/core-utils";
import { Identities, Managers } from "@arkecosystem/crypto";
import nock from "nock";
import { IpfsCommand } from "../../../../../packages/core-tester-cli/src/commands/send/ipfs";
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

describe("Commands - Ipfs", () => {
    it("should apply ipfs transactions", async () => {
        const opts = {
            number: 1,
            ipfsFee: 2,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await IpfsCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);

        expectedTransactions
            .filter(tx => tx.type === 5)
            .map(tx => {
                expect(tx.fee).toEqual(arkToSatoshi(opts.ipfsFee));
                expect(tx.asset.ipfs).toEqual(
                    `Qm${Identities.Address.fromPublicKey(tx.senderPublicKey)
                        .repeat(2)
                        .slice(0, 44)}`,
                );
            });
    });

    it("should apply ipfs transactions with default fee when none specified", async () => {
        const opts = {
            number: 1,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await IpfsCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);

        expectedTransactions
            .filter(tx => tx.type === 5)
            .map(tx => {
                expect(tx.fee).toEqual(arkToSatoshi(5));
                expect(tx.asset.ipfs).toEqual(
                    `Qm${Identities.Address.fromPublicKey(tx.senderPublicKey)
                        .repeat(2)
                        .slice(0, 44)}`,
                );
            });
    });
});
