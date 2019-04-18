import { httpie } from "@arkecosystem/core-utils";
import "jest-extended";
import nock from "nock";
import pokemon from "pokemon";
import { DelegateRegistrationCommand } from "../../../../../packages/core-tester-cli/src/commands/send/delegate-registration";
import { arkToSatoshi, captureTransactions, expectTransactions, toFlags } from "../../shared";

beforeEach(() => {
    // Just passthru. We'll test the Command class logic in its own test file more thoroughly
    nock("http://localhost:4003")
        .get("/api/node/configuration")
        .thrice()
        .reply(200, { data: { constants: {} } });

    nock("http://localhost:4000")
        .get("/config")
        .thrice()
        .reply(200, { data: { network: { name: "unitnet" } } });

    jest.spyOn(httpie, "get");
    jest.spyOn(httpie, "post");
});

afterEach(() => {
    nock.cleanAll();
});

describe("Commands - Delegate Registration", () => {
    it("should register as delegate", async () => {
        const opts = {
            delegateFee: 1,
            number: 1,
        };

        const expectedDelegateName = "mr_bojangles";
        // call to delegates/{publicKey}/voters returns zero delegates
        nock("http://localhost:4003")
            .get("/api/delegates")
            .reply(200, {
                meta: { pageCount: 1 },
                data: [],
            });
        jest.spyOn(pokemon, "random").mockImplementation(() => expectedDelegateName);

        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);

        await DelegateRegistrationCommand.run(toFlags(opts));

        expect(httpie.post).toHaveBeenCalledTimes(2);

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
