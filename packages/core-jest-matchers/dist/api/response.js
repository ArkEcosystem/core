"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
expect.extend({
    toBeSuccessfulResponse: (actual, expected) => {
        return {
            message: () => `Expected ${JSON.stringify({
                data: actual.data,
                status: actual.status,
                headers: actual.headers,
            })} to be a successful response`,
            pass: actual.status === 200 && typeof actual.data === "object",
        };
    },
    toBePaginated: (actual, expected) => {
        return {
            message: () => `Expected ${JSON.stringify({
                data: actual.data,
                status: actual.status,
                headers: actual.headers,
            })} to be a paginated response`,
            pass: actual.data.meta &&
                ["pageCount", "totalCount", "next", "previous", "self", "first", "last"].every(property => Object.keys(actual.data.meta).includes(property)),
        };
    },
});
//# sourceMappingURL=response.js.map