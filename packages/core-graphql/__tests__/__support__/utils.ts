import { app } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "../../../core-test-utils/src/helpers/api";

class Helpers {
    public async request(query) {
        const url = "http://localhost:4005/graphql";
        const server = app.resolve("graphql");

        return ApiHelpers.request(server, "POST", url, {}, { query });
    }
}

/**
 * @type {Helpers}
 */
export const utils = new Helpers();
