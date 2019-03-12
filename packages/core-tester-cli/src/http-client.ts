import axios from "axios";
import { logger } from "./logger";

export class HttpClient {
    private baseURL: any;

    public constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    public async get(path: string, params?: Record<string, any>, headers?: Record<string, any>): Promise<any> {
        const fullURL = this.baseURL + path;
        try {
            const { data } = await axios.get(fullURL, { params, headers });

            return data;
        } catch (error) {
            logger.error(`${fullURL}: ${error.message}`);
        }
    }

    public async post(path: string, payload: Record<string, any>): Promise<any> {
        const fullURL = this.baseURL + path;
        try {
            const { data } = await axios.post(fullURL, payload);

            return data;
        } catch (error) {
            logger.error(`${fullURL}: ${error.message}`);
        }
    }
}
