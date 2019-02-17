import "jest-extended";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { SecondSignatureCommand } from "../../src/commands/second-signature";
import { arkToSatoshi } from "../../src/utils";
import { toFlags } from "../shared";

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

        mockAxios.onPost("http://localhost:4003/api/v2/transactions").reply(200, { data: {} });

        const flags = toFlags(opts);
        await SecondSignatureCommand.run(flags);

        expect(axios.post).toHaveBeenNthCalledWith(
            4,
            "http://localhost:4003/api/v2/transactions",
            {
                transactions: [
                    expect.objectContaining({
                        fee: arkToSatoshi(opts.signatureFee),
                        asset: {
                            signature: {
                                publicKey: expect.any(String),
                            },
                        },
                    }),
                ],
            },
            expect.any(Object),
        );
    });
});
