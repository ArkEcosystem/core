import { httpie } from "@arkecosystem/core-utils";
import "jest-extended";
import nock from "nock";
import { SecondSignatureRegistrationCommand } from "../../../../../packages/core-tester-cli/src/commands/send/second-signature-registration";
import { arkToSatoshi, captureTransactions, expectTransactions, toFlags } from "../../shared";

beforeEach(() => {
    // Just passthru. We'll test the Command class logic in its own test file more thoroughly
    nock("http://localhost:4003")
        .get("/api/v2/node/configuration")
        .reply(200, { data: { constants: {} } });

    nock("http://localhost:4000")
        .get("/config")
        .reply(200, { data: { network: {} } });

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
