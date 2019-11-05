import { Utils } from "@arkecosystem/core-kernel";

export class RestClient {
    public static async get(path: string, opts?: Utils.HttpOptions): Promise<Utils.HttpResponse> {
        return Utils.http.get(`http://localhost:4003/api/${path}`, opts);
    }

    public static async post(path: string, body): Promise<Utils.HttpResponse> {
        return Utils.http.post(`http://localhost:4003/api/${path}`, { body });
    }

    public static async broadcast(transactions): Promise<Utils.HttpResponse> {
        return this.post("transactions", { transactions });
    }
}
