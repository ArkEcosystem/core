import "jest-extended";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { VoteCommand } from "../../src/commands/send/vote";
import { arkToSatoshi, captureTransactions, expectTransactions, toFlags } from "../shared";

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
    jest.restoreAllMocks();
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

        const expectedTransactions = [];
        captureTransactions(mockAxios, expectedTransactions);

        await VoteCommand.run(toFlags(opts));

        expect(axios.post).toHaveBeenCalledTimes(2);

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

        mockAxios.onGet(/http:\/\/localhost:4003\/api\/v2\/delegates/).reply(200, {
            meta: { pageCount: 1 },
            data: [{ publicKey: expectedDelegate }],
        });

        const expectedTransactions = [];
        captureTransactions(mockAxios, expectedTransactions);

        await VoteCommand.run(toFlags(opts));

        expect(axios.post).toHaveBeenCalledTimes(2);

        expectTransactions(expectedTransactions, {
            fee: arkToSatoshi(opts.voteFee),
            asset: {
                votes: [`+${expectedDelegate}`],
            },
        });
    });
});
