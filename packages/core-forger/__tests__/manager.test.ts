import "jest-extended";

import { models } from "@arkecosystem/crypto";
import { defaults } from "../src/defaults";
import { ForgerManager } from "../src/manager";
import { setUp, tearDown } from "./__support__/setup";

const { Delegate } = models;

jest.setTimeout(30000);
jest.mock("../src/client");

let forgeManager;

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
    jest.restoreAllMocks();
});

beforeEach(() => {
    defaults.hosts = [`http://127.0.0.1:4000`];
    forgeManager = new ForgerManager(defaults);
});

describe("Forger Manager", () => {
    describe("loadDelegates", () => {
        it("should be ok with configured delegates", async () => {
            const secret = "a secret";
            forgeManager.secrets = [secret];
            forgeManager.client.getUsernames.mockReturnValue([]);

            const delegates = await forgeManager.loadDelegates();

            expect(delegates).toBeArray();
            delegates.forEach(value => expect(value).toBeInstanceOf(Delegate));
            expect(forgeManager.client.getUsernames).toHaveBeenCalled();
        });
    });
});
