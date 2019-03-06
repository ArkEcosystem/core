import { httpie } from "@arkecosystem/core-utils";

export class HttpClient {
    private baseUrl: string;

    public constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public async get(path: string, query?: any, headers?: any): Promise<any> {
        try {
            const { body } = await httpie.get(`${this.baseUrl}${path}`, { query, headers });

            return body;
        } catch (error) {
            // do nothing...
        }
    }

    public async post(path: string, payload: any): Promise<any> {
        try {
            const { body } = await httpie.post(`${this.baseUrl}${path}`, { body: JSON.stringify(payload) });

            return body;
        } catch (error) {
            // do nothing...
        }
    }
}
