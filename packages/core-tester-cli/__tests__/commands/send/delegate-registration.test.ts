import "jest-extended";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import pokemon from "pokemon";
import { DelegateRegistrationCommand } from "../../../src/commands/send/delegate-registration";
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
        jest.spyOn(pokemon, "random").mockImplementation(() => expectedDelegateName);

        const expectedTransactions = [];
        captureTransactions(mockAxios, expectedTransactions);

        await DelegateRegistrationCommand.run(toFlags(opts));

        expect(axios.post).toHaveBeenCalledTimes(2);

        expectTransactions(expectedTransactions, {
            fee: arkToSatoshi(opts.delegateFee),
            asset: {
                delegate: {
                    username: expectedDelegateName,
                },
            },
        });
    });
});
