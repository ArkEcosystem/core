"use strict";
// Based on https://github.com/fknop/hapi-pagination
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = require("@hapi/boom");
exports.decorate = () => {
    return {
        paginate(response, totalCount, options) {
            options = options || {};
            const key = options.key;
            if (Array.isArray(response) && key) {
                throw boom_1.internal("Object required with results key");
            }
            if (!Array.isArray(response) && !key) {
                throw boom_1.internal("Missing results key");
            }
            if (key && !response[key]) {
                throw boom_1.internal(`key: ${key} does not exists on response`);
            }
            const results = key ? response[key] : response;
            if (key) {
                delete response[key];
            }
            return this.response({
                results,
                totalCount,
                response: Array.isArray(response) ? undefined : response,
            });
        },
    };
};
//# sourceMappingURL=decorate.js.map