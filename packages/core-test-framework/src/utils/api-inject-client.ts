import { Identifiers, Server } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";
import querystring from "querystring";

type ApiResponse = {
    status: number;
    headers: Record<string, string>;
    body: any;
};

@Container.injectable()
export class ApiInjectClient {
    @Container.inject(Identifiers.HTTP)
    private readonly server!: Server;

    public async get(path: string, params: Record<string, string | number> = {}): Promise<ApiResponse> {
        const url = this.getUrl(path, params);
        const request = { method: "GET", url };
        const response = await this.server.inject(request);

        return this.getResponse(response);
    }

    public async post(path: string, body: unknown, params: Record<string, string | number> = {}): Promise<ApiResponse> {
        const url = this.getUrl(path, params);
        const payload = JSON.stringify(body);
        const headers = { "Content-Type": "application/json" };
        const request = { method: "POST", url, payload, headers };
        const response = await this.server.inject(request);

        return this.getResponse(response);
    }

    private getUrl(path: string, params: Record<string, string | number>): string {
        return path.includes("?")
            ? `${this.server.uri}/api${path}&${querystring.stringify(params)}`
            : `${this.server.uri}/api${path}?${querystring.stringify(params)}`;
    }

    private getResponse(response: any): ApiResponse {
        const responseHeaders = {};
        for (const pair of Object.entries(response.headers)) {
            const headerName = pair[0].toLowerCase();
            const headerValue = String(pair[1]);
            responseHeaders[headerName] = headerValue;
        }

        const responseBody = JSON.parse(JSON.stringify(response.result));

        return {
            status: response.statusCode,
            headers: responseHeaders,
            body: responseBody,
        };
    }
}
