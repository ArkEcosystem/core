import parseJSON from "fast-json-parse";
import got from "got";

export class HttpieError extends Error {
    constructor(error) {
        super(error.message || error);

        Object.defineProperty(this, "message", {
            enumerable: false,
            value: error.message || error,
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

export interface HttpieResponse<T> {
    body: T;
    headers: { [key: string]: string };
    status: number;
}

// todo: review implementation
class Httpie {
    public async get<T = any>(url: string, opts?): Promise<HttpieResponse<T>> {
        return this.sendRequest("get", url, opts);
    }

    public async post<T = any>(url: string, opts?): Promise<HttpieResponse<T>> {
        return this.sendRequest("post", url, opts);
    }

    public async put<T = any>(url: string, opts?): Promise<HttpieResponse<T>> {
        return this.sendRequest("put", url, opts);
    }

    public async patch<T = any>(url: string, opts?): Promise<HttpieResponse<T>> {
        return this.sendRequest("patch", url, opts);
    }

    public async head<T = any>(url: string, opts?): Promise<HttpieResponse<T>> {
        return this.sendRequest("head", url, opts);
    }

    public async delete<T = any>(url: string, opts?): Promise<HttpieResponse<T>> {
        return this.sendRequest("delete", url, opts);
    }

    private async sendRequest<T>(method: string, url: string, opts?): Promise<HttpieResponse<T>> {
        if (!opts) {
            opts = {};
        }

        opts.headers = opts.headers || {};
        opts.headers["content-type"] = "application/json";

        opts.timeout = opts.timeout || 1500;

        // Do not retry unless explicitly stated.
        opts.retry = opts.retry || {
            retries: 0,
        };

        if (opts.body && typeof opts !== "string") {
            opts.body = JSON.stringify(opts.body);
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
