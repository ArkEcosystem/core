import "jest-extended";

import { httpie } from "@arkecosystem/core-utils";
import { Managers } from "@arkecosystem/crypto";
import nock from "nock";
import { VoteCommand } from "../../../../../packages/core-tester-cli/src/commands/send/vote";
import { arkToSatoshi, captureTransactions, expectTransactions, toFlags } from "../../shared";
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

describe("Commands - Vote", () => {
    it("should vote for specified delegate", async () => {
        const expectedDelegate = "03f294777f7376e970b2bd4805b4a90c8449b5935d530bdb566d02800ac44a4c00";
        const opts = {
            number: 1,
            voteFee: 1,
            delegate: expectedDelegate,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await VoteCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);

        expectTransactions(expectedTransactions, {
            fee: arkToSatoshi(opts.voteFee),
            asset: {
                votes: [`+${expectedDelegate}`],
            },
        });
    });

    it("should vote random delegate if non specified", async () => {
        const expectedDelegate = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        const opts = {
            number: 1,
            voteFee: 1,
        };

        nock("http://localhost:4003")
            .get("/api/delegates")
            .reply(200, {
                meta: { pageCount: 1 },
                data: [{ publicKey: expectedDelegate }],
            });

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await VoteCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);

        expectTransactions(expectedTransactions, {
            fee: arkToSatoshi(opts.voteFee),
            asset: {
                votes: [`+${expectedDelegate}`],
            },
        });
    });
});
