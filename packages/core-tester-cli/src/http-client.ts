import Axios from "axios";
import { logger } from "./logger";

class HttpClient {
    private instance: any;

    public setup(host: string, port: number) {
        this.instance = Axios.create({
            baseURL: `${host}:${port}/api/v2/`,
        });
    }

    public async get(path: string, params?: Record<string, any>): Promise<any> {
        try {
            const { data } = await this.instance.get(path, { params });

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

export const http = new HttpClient();
