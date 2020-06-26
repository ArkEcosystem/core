import "jest-extended";

import { getConnectionData } from "@packages/core-manager/src/utils";

beforeEach(() => {
    process.env.CORE_API_DISABLED = "true";
    process.env.CORE_API_HOST = "127.0.0.1";
    process.env.CORE_API_PORT = "5000";
    process.env.CORE_API_SSL_HOST = "127.0.0.1";
    process.env.CORE_API_SSL_PORT = "6000";
});

describe("GetConnectionData", () => {
    describe("HTTPS", () => {
        it("should return https settings", async () => {
            expect(getConnectionData()).toEqual({ ip: "127.0.0.1", port: 6000, protocol: "https" });
        });

        it("should return default https settings", async () => {
            delete process.env.CORE_API_SSL_HOST;
            delete process.env.CORE_API_SSL_PORT;

            expect(getConnectionData()).toEqual({ ip: "0.0.0.0", port: 8443, protocol: "https" });
        });
    });

    describe("HTTP", () => {
        beforeEach(() => {
            delete process.env.CORE_API_DISABLED;
        });

        it("should return https settings", async () => {
            expect(getConnectionData()).toEqual({ ip: "127.0.0.1", port: 5000, protocol: "http" });
        });

        it("should return default https settings", async () => {
            delete process.env.CORE_API_HOST;
            delete process.env.CORE_API_PORT;

            expect(getConnectionData()).toEqual({ ip: "0.0.0.0", port: 4003, protocol: "http" });
        });
    });
});
