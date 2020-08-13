import { Identifiers, Server } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";
import querystring from "querystring";

type ApiResponse = {
    status: number;
    headers: Record<string, string>;
    data: any;
};

@Container.injectable()
export class ApiInjectClient {
    @Container.inject(Identifiers.HTTP)
    private readonly server!: Server;

    public async get(path: string, params: Record<string, string | number> = {}): Promise<ApiResponse> {
        const url = `${this.server.uri}/api${path}?${querystring.stringify(params)}`;
        const request = { method: "GET", url };
        const response = await this.server.inject(request);

        return this.parseInjectResponse(response);
    }

    public async post(path: string, body: unknown, params: Record<string, string | number> = {}): Promise<ApiResponse> {
        const url = `${this.server.uri}/api${path}?${querystring.stringify(params)}`;
        const payload = JSON.stringify(body);
        const headers = { "Content-Type": "application/json" };
        const request = { method: "POST", url, payload, headers };
        const response = await this.server.inject(request);

        return this.parseInjectResponse(response);
    }

    private parseInjectResponse(response: any): ApiResponse {
        const responseHeaders = {};
        for (const pair of Object.entries(response.headers)) {
            const headerName = pair[0].toLowerCase();
            const headerValue = String(pair[1]);
            responseHeaders[headerName] = headerValue;
        }

        const responseData = JSON.parse(JSON.stringify(response.result));

        return {
            status: response.statusCode,
            headers: responseHeaders,
            data: responseData,
        };
    }
}
