import "jest-extended";

// import Boom from "@hapi/boom";
import { Application } from "@arkecosystem/core-kernel";
import { initApp } from "../__support__";
import { initServer } from "./__support__";


let app: Application;

beforeEach(() => {
    app = initApp();
});

describe("Set Headers", () => {
    let defaults: any;
    let customResponse: any;
    let customRoute: any;
    let injectOptions: any;

    beforeEach(() => {
        defaults = {
            plugins: {
                pagination: {
                    limit: 100,
                },
            },
        };

        customResponse = {
            data: "ok"
        };

        customRoute = {
            method: 'GET',
            path: '/test',
            handler: () => {
                return customResponse
            },
        };

        injectOptions = {
            method: 'GET',
            url: '/test',
        };
    });


    it("shod resolve if response is not boom", async () => {
        let server = await initServer(app, defaults, customRoute);

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toBe("ok");
    });

    // // TODO: Review
    // it("shod resolve if response is boom", async () => {
    //     customResponse = Boom.badImplementation("Bad Implementation", "ok");
    //     // customResponse = Boom.badImplementation("Bad Implementation", "ok");
    //     let server = await initServer(app, defaults, customRoute);
    //
    //     const response = await server.inject(injectOptions);
    //     const payload = JSON.parse(response.payload || {});
    //     console.log(payload);
    //     // expect(payload.data).toBe("ok");
    // });
});
