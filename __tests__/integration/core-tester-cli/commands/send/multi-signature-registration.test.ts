import "jest-extended";

import { httpie } from "@arkecosystem/core-utils";
import { Managers, Transactions } from "@arkecosystem/crypto";
import nock from "nock";
import { MultiSignatureRegistrationCommand } from "../../../../../packages/core-tester-cli/src/commands/send/multi-signature-registration";
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

describe("Commands - Multi signature registration", () => {
    it("should apply multi signature", async () => {
        const opts = {
            multiSignatureFee: 1,
            number: 1,
            participants:
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37," +
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d," +
                "0290907d441d257334c4376126d6cbf37cd7993ca2d0cc58850b30b869d4bf4c3e",
        };

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await MultiSignatureRegistrationCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);
        expectTransactions(expectedTransactions, {
            fee: arkToSatoshi(20),
            asset: {
                multiSignature: {
                    min: 3,
                    publicKeys: expect.toContainValues(opts.participants.split(",")),
                },
            },
        });

        expect(Transactions.Verifier.verify(expectedTransactions[0])).toBeTrue();
    });
});
