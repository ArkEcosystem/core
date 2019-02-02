import "jest-extended";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import superheroes from "superheroes";
import { DelegateRegistrationCommand } from "../../src/commands/delegate-registration";
import { arkToArktoshi } from "../../src/utils";
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

describe("Commands - Delegate Registration", () => {
    it("should register as delegate", async () => {
        const opts = {
            delegateFee: 1,
            number: 1,
        };

        const expectedDelegateName = "mr_bojangles";
        // call to delegates/{publicKey}/voters returns zero delegates
        mockAxios.onGet(/http:\/\/localhost:4003\/api\/v2\/delegates/).reply(200, {
            meta: { pageCount: 1 },
            data: [],
        });
        jest.spyOn(superheroes, "random").mockImplementation(() => expectedDelegateName);

        mockAxios.onPost("http://localhost:4003/api/v2/transactions").reply(200, { data: {} });

        const flags = toFlags(opts);
        await DelegateRegistrationCommand.run(flags);

        expect(axios.post).toHaveBeenNthCalledWith(
            4,
            "http://localhost:4003/api/v2/transactions",
            {
                transactions: [
                    expect.objectContaining({
                        fee: arkToArktoshi(opts.delegateFee),
                        asset: {
                            delegate: {
                                username: expectedDelegateName,
                            },
                        },
                    }),
                ],
            },
            expect.any(Object),
        );
    });
});
