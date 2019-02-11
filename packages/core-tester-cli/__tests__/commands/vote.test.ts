import "jest-extended";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { VoteCommand } from "../../src/commands/vote";
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

afterAll(() => mockAxios.restore());

describe("Commands - Vote", () => {
    it("should vote for specified delegate", async () => {
        const expectedDelegate = "03f294777f7376e970b2bd4805b4a90c8449b5935d530bdb566d02800ac44a4c00";
        const opts = {
            number: 1,
            voteFee: 1,
            delegate: expectedDelegate,
        };

        mockAxios.onGet(/http:\/\/localhost:4003\/api\/v2\/delegates.*/).reply(200);
        mockAxios.onPost("http://localhost:4003/api/v2/transactions").reply(200, { data: {} });

        const flags = toFlags(opts);
        await VoteCommand.run(flags);

        expect(axios.post).toHaveBeenNthCalledWith(
            4,
            "http://localhost:4003/api/v2/transactions",
            {
                transactions: [
                    expect.objectContaining({
                        fee: arkToArktoshi(opts.voteFee),
                        asset: {
                            votes: [`+${expectedDelegate}`],
                        },
                    }),
                ],
            },
            expect.any(Object),
        );
    });

    it("should vote random delegate if non specified", async () => {
        const expectedDelegate = "03f294777f7376e970b2bd4805b4a90c8449b5935d530bdb566d02800ac44a4c00";
        const opts = {
            number: 1,
            voteFee: 1,
        };

        mockAxios.onPost("http://localhost:4003/api/v2/transactions").reply(200, { data: {} });
        mockAxios.onGet(/http:\/\/localhost:4003\/api\/v2\/delegates\/.*/).reply(200); // call to delegates/{publicKey}/voters
        // call to /delegates
        mockAxios.onGet(/http:\/\/localhost:4003\/api\/v2\/delegates/).reply(200, {
            meta: { pageCount: 1 },
            data: [{ publicKey: expectedDelegate }],
        });

        const flags = toFlags(opts);
        await VoteCommand.run(flags);

        expect(axios.post).toHaveBeenNthCalledWith(
            4,
            "http://localhost:4003/api/v2/transactions",
            {
                transactions: [
                    expect.objectContaining({
                        fee: arkToArktoshi(opts.voteFee),
                        asset: {
                            votes: [`+${expectedDelegate}`],
                        },
                    }),
                ],
            },
            expect.any(Object),
        );
    });
});
