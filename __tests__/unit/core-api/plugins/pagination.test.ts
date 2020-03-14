import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application } from "@arkecosystem/core-kernel";
import { initApp } from "../__support__";
import { initServer } from "./__support__";
import Joi from "@hapi/joi";


let app: Application;
let customResponse: any;

beforeEach(() => {
    app = initApp();
});

class TestRoute {
    public name = "test";

    public register (server: Hapi.Server): void {
        let customRoute = {
            method: 'GET',
            path: '/api/transactions',
            handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                console.log(request, h);
                return customResponse
            },
            options: {
                validate: {
                    query: Joi.object({
                        ...server.app.schemas.pagination,
                    })
                }
            }
        };

        server.route(customRoute)
    };
}

class TestRouteWithoutPagination {
    public name = "test";

    public register (server: Hapi.Server): void {
        let customRoute = {
            method: 'GET',
            path: '/api/transactions',
            handler: () => {
                return customResponse
            },
        };

        server.route(customRoute)
    };
}


describe("Pagination", () => {
    let defaults: any;
    let injectOptions: any;

    beforeEach(() => {
        defaults = {
            plugins: {
                pagination: {
                    limit: 100,
                },
            },
        };

        customResponse = ["Item1", "Item2", "Item3"];

        injectOptions = {
            method: 'GET',
            url: '/api/transactions',
        };
    });

    it("should return ok if payload is valid", async () => {
        let server = await initServer(app, defaults, null);

        server.register({
            plugin: new TestRouteWithoutPagination()
        });

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toEqual(["Item1", "Item2", "Item3"]);
    });

    it("should return ok if payload is valid", async () => {
        let server = await initServer(app, defaults, null);

        server.register({
            plugin: new TestRoute()
        });

        const response = await server.inject(injectOptions);
        const payload = JSON.parse(response.payload || {});
        expect(payload.data).toEqual(["Item1", "Item2", "Item3"]);
    });
});
