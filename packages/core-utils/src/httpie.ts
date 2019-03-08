// tslint:disable: max-classes-per-file

import parseJSON from "fast-json-parse";
import got from "got";

export class HttpieError extends Error {
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

        Object.defineProperty(this, "response", {
            enumerable: false,
            value: {
                body: parseJSON(error.response.body).value,
                headers: error.response.headers,
                status: error.response.statusCode,
            },
        });

        Error.captureStackTrace(this, this.constructor);
    }
}

class Httpie {
    public async get(url: string, opts?): Promise<any> {
        return this.sendRequest("get", url, opts);
    }

    public async post(url: string, opts?): Promise<any> {
        return this.sendRequest("post", url, opts);
    }

    public async put(url: string, opts?): Promise<any> {
        return this.sendRequest("put", url, opts);
    }

    public async patch(url: string, opts?): Promise<any> {
        return this.sendRequest("patch", url, opts);
    }

    public async head(url: string, opts?): Promise<any> {
        return this.sendRequest("head", url, opts);
    }

    public async delete(url: string, opts?): Promise<any> {
        return this.sendRequest("delete", url, opts);
    }

    private async sendRequest(method: string, url: string, opts?): Promise<any> {
        if (!opts) {
            opts = {};
        }

        if (opts.body && typeof opts !== "string") {
            opts.body = JSON.stringify(opts.body);
        }

        // Do not retry unless explicitly stated.
        if (!opts.retry) {
            opts.retry = { retries: 0 };
        }

        try {
            const { body, headers, statusCode } = await got[method](url, opts);

            return {
                body: parseJSON(body).value,
                headers,
                status: statusCode,
            };
        } catch (error) {
            throw new HttpieError(error);
        }
    }
}

export const httpie = new Httpie();
