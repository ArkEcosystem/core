"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
const logger_1 = require("./logger");
class HttpClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async get(path, query, headers) {
        const fullURL = `${this.baseUrl}${path}`;
        try {
            const { body } = await core_utils_1.httpie.get(fullURL, { query, headers });
            return body;
        }
        catch (error) {
            logger_1.logger.error(`${fullURL}: ${error.message}`);
        }
    }
    async post(path, payload) {
        const fullURL = `${this.baseUrl}${path}`;
        try {
            const { body } = await core_utils_1.httpie.post(fullURL, { body: payload });
            return body;
        }
        catch (error) {
            logger_1.logger.error(`${fullURL}: ${error.message}`);
        }
    }
}
exports.HttpClient = HttpClient;
//# sourceMappingURL=http-client.js.map