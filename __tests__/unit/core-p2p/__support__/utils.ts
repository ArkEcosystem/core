import { app } from "@arkecosystem/core-container";
import { ApiHelpers } from "@arkecosystem/core-test-utils/src/helpers/api";

class Helpers {
    public headers: any;
    constructor() {
        this.headers = {
            nethash: "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
            port: 4000,
            version: "2.0.0",
        };
    }

    public async GET(endpoint, params = {}) {
        return this.request("GET", endpoint, params);
    }

    public async POST(endpoint, params) {
        return this.request("POST", endpoint, params);
    }

    public async request(method, path, params = {}) {
        const url = `http://localhost:4002/${path}`;
        const server = app.resolvePlugin("p2p").server;

        return ApiHelpers.request(server, method, url, this.headers, params);
    }
}

/**
 * @type {Helpers}
 */
export const utils = new Helpers();
