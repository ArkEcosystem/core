"use strict";
// tslint:disable: max-classes-per-file
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fast_json_parse_1 = __importDefault(require("fast-json-parse"));
const got_1 = __importDefault(require("got"));
class HttpieError extends Error {
    constructor(error) {
        super(error.message);
        Object.defineProperty(this, "message", {
            enumerable: false,
            value: error.message,
        });
        Object.defineProperty(this, "name", {
            enumerable: false,
            value: this.constructor.name,
        });
        if (error.response) {
            Object.defineProperty(this, "response", {
                enumerable: false,
                value: {
                    body: fast_json_parse_1.default(error.response.body).value,
                    headers: error.response.headers,
                    status: error.response.statusCode,
                },
            });
        }
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.HttpieError = HttpieError;
class Httpie {
    async get(url, opts) {
        return this.sendRequest("get", url, opts);
    }
    async post(url, opts) {
        return this.sendRequest("post", url, opts);
    }
    async put(url, opts) {
        return this.sendRequest("put", url, opts);
    }
    async patch(url, opts) {
        return this.sendRequest("patch", url, opts);
    }
    async head(url, opts) {
        return this.sendRequest("head", url, opts);
    }
    async delete(url, opts) {
        return this.sendRequest("delete", url, opts);
    }
    async sendRequest(method, url, opts) {
        if (!opts) {
            opts = {};
        }
        if (!opts.headers) {
            opts.headers = {};
        }
        opts.headers["content-type"] = "application/json";
        if (opts.body && typeof opts !== "string") {
            opts.body = JSON.stringify(opts.body);
        }
        // Do not retry unless explicitly stated.
        if (!opts.retry) {
            opts.retry = { retries: 0 };
        }
        if (!opts.timeout && process.env.NODE_ENV !== "test") {
            opts.timeout = 1500;
        }
        try {
            const { body, headers, statusCode } = await got_1.default[method](url, opts);
            return {
                body: fast_json_parse_1.default(body).value,
                headers,
                status: statusCode,
            };
        }
        catch (error) {
            throw new HttpieError(error);
        }
    }
}
exports.httpie = new Httpie();
//# sourceMappingURL=httpie.js.map