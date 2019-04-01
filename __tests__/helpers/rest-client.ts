import { httpie, IHttpieResponse } from "@arkecosystem/core-utils";

export class RestClient {
    public static async get<T = any>(path: string, opts?): Promise<IHttpieResponse<T>> {
        return httpie.get(`http://localhost:4003/api/v2/${path}`, opts);
    }

    public static async post<T = any>(path: string, body): Promise<IHttpieResponse<T>> {
        return httpie.post(`http://localhost:4003/api/v2/${path}`, { body });
    }

    public static async broadcast<T = any>(transactions): Promise<IHttpieResponse<T>> {
        return RestClient.post("transactions", { transactions });
    }
}
