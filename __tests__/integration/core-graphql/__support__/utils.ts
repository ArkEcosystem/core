import { app } from "@arkecosystem/core-container";
import { ApiHelpers } from "../../../utils/helpers/api";

class Helpers {
    public async request(query) {
        const url = "http://localhost:4005/graphql";
        const server = app.resolvePlugin("graphql");

        return ApiHelpers.request(server, "POST", url, {}, { query });
    }
}

/**
 * @type {Helpers}
 */
export const utils = new Helpers();
