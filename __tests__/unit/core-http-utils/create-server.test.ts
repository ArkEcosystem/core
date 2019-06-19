import { createServer } from "../../../packages/core-http-utils/src/server/create";

describe("createServer ", () => {
    /*
    describe("invalid plugins list", ()=>{
        it("should error", async () => {
            await expect(
                createServer({host: "0.0.0.0", port: 3000},
                  jest.fn(),
                  [require("hapi-trailing-slash")]
                )
            ).rejects.toHaveProperty("name", "Error");
            //required option missing. plugins with options must be registered after creation
        });
    });
*/
    describe("valid plugins list", () => {
        it("should succeed", async () => {
            // let server;
            // server =
            await createServer(
                { host: "0.0.0.0", port: 3000 },
                jest.fn(),
                [require("hapi-rate-limit")],
                // @TODO: use a mock plugin
            );
            // expect(server.plugins.length).toBe(2);
        });
    });

    describe("valid callback", () => {
        it("should be executed", async () => {
            const theCallback = jest.fn();
            await createServer({ host: "0.0.0.0", port: 3000 }, theCallback);
            expect(theCallback).toBeCalled();
        });
    });
});
