import { Identifiers, Server } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";
import querystring from "querystring";

export type ApiServerResponse = {
    status: number;
    headers: Record<string, string>;
    data: unknown;
};

@Container.injectable()
export class ApiServerClient {
    @Container.inject(Identifiers.HTTP)
    private readonly server!: Server;

    public async get(
        path: string,
        options = {
            params: {} as Record<string, string>,
            headers: {} as Record<string, string>,
        },
    ): Promise<ApiServerResponse> {
        const url = `${this.server.uri}/api${path}?${querystring.stringify(options.params)}`;
        const request = { method: "GET", url, headers: options.headers };
        const response = await this.server.inject(request);

        return {
            status: response.statusCode,
            headers: response.headers,
            data: JSON.parse(response.result),
        };
    }

    public async post(
        path: string,
        body: unknown,
        options = {
            params: {} as Record<string, string>,
            headers: {} as Record<string, string>,
        },
    ): Promise<ApiServerResponse> {
        const url = `${this.server.uri}/api${path}?${querystring.stringify(options.params)}`;
        const payload = JSON.stringify(body);
        const headers = { "Content-Type": "application/json", ...options.headers };
        const request = { method: "POST", url, payload, headers };
        const response = await this.server.inject(request);

        return {
            status: response.statusCode,
            headers: response.headers,
            data: JSON.parse(response.result),
        };
    }
}
