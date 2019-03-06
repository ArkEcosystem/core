import parseJSON from "fast-json-parse";
import got, { GotJSONOptions } from "got";

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
        const { body, headers, statusCode } = await got[method](url, opts);

        return {
            body: parseJSON(body).value,
            headers,
            statusCode,
        };
    }
}

export const httpie = new Httpie();
