import axios from "axios";

export class HttpClient {
    private baseURL: any;

    public constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    public async get(path: string, params?: Record<string, any>, headers?: Record<string, any>): Promise<any> {
        try {
            const { data } = await axios.get(`${this.baseURL}${path}`, { params, headers });

            return data;
        } catch (error) {
            // do nothing...
        }
    }

    public async post(path: string, payload: Record<string, any>): Promise<any> {
        try {
            const { data } = await axios.post(`${this.baseURL}${path}`, payload);

            return data;
        } catch (error) {
            // do nothing...
        }
    }
}
