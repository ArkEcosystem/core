import { app } from "@arkecosystem/core-container";
import apiHelpers from "../../../core-test-utils/src/helpers/api";

class Helpers {
  public async request(query) {
    const url = "http://localhost:4005/graphql";
    const server = app.resolvePlugin("graphql");

    return apiHelpers.request(server, "POST", url, {}, { query });
  }
}

/**
 * @type {Helpers}
 */
export default new Helpers();
