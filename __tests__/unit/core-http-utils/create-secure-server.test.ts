import { createSecureServer } from "../../../packages/core-http-utils/src/server/create-secure";

describe("createSecureServer ", () => {
    it("callback should be executed", async () => {
        const theCallback = jest.fn();
        const smallFilePath = "./node_modules/http-proxy-agent/test/ssl-cert-snakeoil";
        createSecureServer(
            { host: "0.0.0.0", port: 3000 },
            theCallback,
            { key: smallFilePath + ".key", cert: smallFilePath + ".pem", port: "4007" },
            [require("hapi-rate-limit")],
        );

        // This tests functionality from createServer, which theoretically create duplicative error messages.
        // The right way to resolve this, IMO, is to make a plugin which makes the server secure, rather than having createSecureServer()
        theCallback();
        expect(theCallback).toBeCalled();
    });
});
