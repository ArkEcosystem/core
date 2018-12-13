import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import "jest-extended";
import superheroes from "superheroes";
import { DelegateRegistration } from "../../src/commands/delegate-registration";

const mockAxios = new MockAdapter(axios);

const defaultOpts = {
    skipTesting: true,
    skipValidation: true,
};
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
            ...defaultOpts,
            delegateFee: 1,
            number: 1,
        };
        const command = await DelegateRegistration.init(opts);
        const expectedDelegateName = "mr_bojangles";
        // call to delegates/{publicKey}/voters returns zero delegates
        mockAxios.onGet(/http:\/\/localhost:4003\/api\/v2\/delegates/).reply(200, {
            meta: { pageCount: 1 },
            data: [],
        });
        jest.spyOn(superheroes, "random").mockImplementation(() => expectedDelegateName);

        await command.run();

        expect(axios.post).toHaveBeenNthCalledWith(
            2,
            "http://localhost:4003/api/v2/transactions",
            {
                transactions: [
                    expect.objectContaining({
                        fee: DelegateRegistration.__arkToArktoshi(opts.delegateFee),
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
