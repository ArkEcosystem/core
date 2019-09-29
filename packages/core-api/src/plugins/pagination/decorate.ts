// Based on https://github.com/fknop/hapi-pagination

import { internal } from "@hapi/boom";

export const decorate = () => {
    return {
        paginate(response, totalCount, options) {
            options = options || {};

            const key = options.key;

            if (Array.isArray(response) && key) {
                throw internal("Object required with results key");
            }

            if (!Array.isArray(response) && !key) {
                throw internal("Missing results key");
            }

            if (key && !response[key]) {
                throw internal(`key: ${key} does not exists on response`);
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
