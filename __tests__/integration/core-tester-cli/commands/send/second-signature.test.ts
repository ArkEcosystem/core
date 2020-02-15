import "jest-extended";

import { httpie } from "@arkecosystem/core-utils";
import { Managers } from "@arkecosystem/crypto";
import nock from "nock";
import { SecondSignatureRegistrationCommand } from "../../../../../packages/core-tester-cli/src/commands/send/second-signature-registration";
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
});

describe("Commands - Second signature", () => {
    it("should apply second signature", async () => {
        const opts = {
            signatureFee: 1,
            number: 1,
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await SecondSignatureRegistrationCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);

        expectTransactions(expectedTransactions, {
            fee: arkToSatoshi(opts.signatureFee),
            asset: {
                signature: {
                    publicKey: expect.any(String),
                },
            },
        });
    });
});
