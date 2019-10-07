import { Utils } from "@arkecosystem/core-kernel";

export class RestClient {
    public static async get<T>(path: string, opts?): Promise<Utils.HttpieResponse<T>> {
        return Utils.httpie.get(`http://localhost:4003/api/${path}`, opts);
    }

    public static async post<T>(path: string, body): Promise<Utils.HttpieResponse<T>> {
        return Utils.httpie.post(`http://localhost:4003/api/${path}`, { body });
    }

    public static async broadcast<T>(transactions): Promise<Utils.HttpieResponse<T>> {
        return this.post("transactions", { transactions });
    }
}
