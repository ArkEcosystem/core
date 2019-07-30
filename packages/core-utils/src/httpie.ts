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

        if (error.response) {
            Object.defineProperty(this, "response", {
                enumerable: false,
                value: {
                    body: parseJSON(error.response.body).value,
                    headers: error.response.headers,
                    status: error.response.statusCode,
                },
            });
        }

        Error.captureStackTrace(this, this.constructor);
    }
}

export interface IHttpieResponse<T> {
    body: T;
    headers: { [key: string]: string };
    status: number;
}

class Httpie {
    public async get<T = any>(url: string, opts?): Promise<IHttpieResponse<T>> {
        return this.sendRequest("get", url, opts);
    }

    public async post<T = any>(url: string, opts?): Promise<IHttpieResponse<T>> {
        return this.sendRequest("post", url, opts);
    }

    public async put<T = any>(url: string, opts?): Promise<IHttpieResponse<T>> {
        return this.sendRequest("put", url, opts);
    }

    public async patch<T = any>(url: string, opts?): Promise<IHttpieResponse<T>> {
        return this.sendRequest("patch", url, opts);
    }

    public async head<T = any>(url: string, opts?): Promise<IHttpieResponse<T>> {
        return this.sendRequest("head", url, opts);
    }

    public async delete<T = any>(url: string, opts?): Promise<IHttpieResponse<T>> {
        return this.sendRequest("delete", url, opts);
    }

    private async sendRequest<T>(method: string, url: string, opts?): Promise<IHttpieResponse<T>> {
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
