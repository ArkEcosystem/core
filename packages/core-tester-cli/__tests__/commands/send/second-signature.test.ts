import "jest-extended";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { SecondSignatureRegistrationCommand } from "../../../src/commands/send/second-signature-registration";
import { arkToSatoshi, captureTransactions, expectTransactions, toFlags } from "../../shared";

const mockAxios = new MockAdapter(axios);

beforeEach(() => {
    // Just passthru. We'll test the Command class logic in its own test file more thoroughly
    mockAxios.onGet("http://localhost:4003/api/v2/node/configuration").reply(200, { data: { constants: {} } });
    mockAxios.onGet("http://localhost:4000/config").reply(200, { data: { network: {} } });
    jest.spyOn(axios, "get");
    jest.spyOn(axios, "post");
});

afterEach(() => {
    mockAxios.reset();
});

describe("Commands - Second signature", () => {
    it("should apply second signature", async () => {
        const opts = {
            signatureFee: 1,
            number: 1,
        };

        const expectedTransactions = [];
        captureTransactions(mockAxios, expectedTransactions);

        await SecondSignatureRegistrationCommand.run(toFlags(opts));

        expect(axios.post).toHaveBeenCalledTimes(2);

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
