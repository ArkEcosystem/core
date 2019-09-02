import { Utils } from "@arkecosystem/core-kernel";

import { logger } from "./logger";

export class HttpClient {
    private baseUrl: string;

    public constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public async get(path: string, query?: any, headers?: any): Promise<any> {
        const fullURL = `${this.baseUrl}${path}`;

        try {
            const { body } = await Utils.httpie.get(fullURL, { query, headers });

            return body;
        } catch (error) {
            logger.error(`${fullURL}: ${error.message}`);
        }
    }

    public async post(path: string, payload: any): Promise<any> {
        const fullURL = `${this.baseUrl}${path}`;

        try {
            const { body } = await Utils.httpie.post(fullURL, { body: payload });

            return body;
        } catch (error) {
            logger.error(`${fullURL}: ${error.message}`);
        }
    }
}
