import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { Application } from "@packages/core-kernel";

import { initApp } from "../__support__";
import { initServer } from "./__support__";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

let app: Application;

beforeEach(() => {
    app = initApp(crypto);
});

describe("Whitelist", () => {
    let defaults: any;
    let customRoute: any;
    let injectOptions: any;

    beforeEach(() => {
        defaults = {
            plugins: {
                pagination: {
                    limit: 100,
                },
                whitelist: ["127.0.0.1"],
            },
        };

        customRoute = {
            method: "GET",
            path: "/test",
            handler: () => "ok",
        };

        injectOptions = {
            method: "GET",
            url: "/test",
        };
    });

    it("shod resolve if whitelist options is not provided", async () => {
        delete defaults.plugins.whitelist;
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        expect(response.payload).toBe("ok");
    });

    it("shod resolve if request ip is whitelisted", async () => {
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        expect(response.payload).toBe("ok");
    });

    it("shod return error if request ip is not whitelisted", async () => {
        defaults.plugins.whitelist = ["128.0.0.1"];
        const server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.statusCode).toBe(403);
    });
});
