import Axios from "axios";
import { logger } from "./logger";

export class HttpClient {
    private instance: any;

    public constructor(baseURL: string) {
        this.instance = Axios.create({ baseURL });
    }

    public async get(path: string, params?: Record<string, any>, headers?: Record<string, any>): Promise<any> {
        try {
            const { data } = await this.instance.get(path, { params, headers });

            return data;
        } catch (error) {
            logger.error(error.message);
        }
    }

    public async post(path: string, payload: Record<string, any>): Promise<any> {
        try {
            const { data } = await this.instance.post(path, payload);

            return data;
        } catch (error) {
            logger.error(error.message);
        }
    }
}
