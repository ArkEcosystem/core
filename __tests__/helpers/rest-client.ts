import { Utils } from "@arkecosystem/core-kernel";

export class RestClient {
    public static async get<T = any>(path: string, opts?): Promise<Utils.IHttpieResponse<T>> {
        return Utils.httpie.get(`http://localhost:4003/api/${path}`, opts);
    }

    public static async post<T = any>(path: string, body): Promise<Utils.IHttpieResponse<T>> {
        return Utils.httpie.post(`http://localhost:4003/api/${path}`, { body });
    }

    public static async broadcast<T = any>(transactions): Promise<Utils.IHttpieResponse<T>> {
        return this.post("transactions", { transactions });
    }
}
