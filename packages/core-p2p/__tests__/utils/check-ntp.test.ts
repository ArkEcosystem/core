import { Container } from "@arkecosystem/core-kernel";
import { checkNTP } from "@arkecosystem/core-p2p/src/utils/check-ntp";

jest.mock("@hapi/sntp", () => {
    return {
        time: jest.fn().mockImplementation((options) => {
            if (options.host === "notime.unknown.not") {
                throw new Error("Host unreachable");
            }
            return { t: 111 };
        }),
    };
});

const logger = { error: jest.fn() };
const appGet = {
    [Container.Identifiers.LogService]: logger,
};
const app = {
    get: (id: any) => appGet[id],
} as any;

describe("Check NTP", () => {
    const hosts = ["pool.ntp.org", "time.google.com"];
    const host = hosts[0];

    it("should get the time from hosts", async () => {
        const response = await checkNTP(app, [host]);

        expect(response).toBeObject();
        expect(response.host).toBe(host);
        expect(response.time).toBeObject();
        expect(response.time.t).toBeNumber();
    });

    describe("when none of the host could be reached", () => {
        it("produces an error", async () => {
            try {
                await checkNTP(app, ["notime.unknown.not"]);
                throw new Error("An error should have been thrown");
            } catch (error) {
                expect(error.message).toMatch(/ntp.*connect/i);
            }
        });
    });
});
