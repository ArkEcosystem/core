import { Identifiers, Server } from "@arkecosystem/core-api";
import { Container, Utils } from "@arkecosystem/core-kernel";
import querystring from "querystring";

type ApiResponse = {
    status: number;
    headers: Record<string, string>;
    body: any;
};

@Container.injectable()
export class ApiHttpClient {
    @Container.inject(Identifiers.HTTP)
    private readonly server!: Server;

    public async get(path: string, params: Record<string, string | number> = {}): Promise<ApiResponse> {
        let response;
        try {
            const url = this.getUrl(path, params);
            response = await Utils.http.get(url);
        } catch (error) {
            return this.getResponse(error.response);
        }

        return this.getResponse(response);
    }

    public async post(path: string, body: unknown, params: Record<string, string | number> = {}): Promise<ApiResponse> {
        let response;
        try {
            const url = this.getUrl(path, params);
            response = await Utils.http.post(url, { body: body as any });
        } catch (error) {
            return this.getResponse(error.response);
        }

        return this.getResponse(response);
    }

    private getUrl(path: string, params: Record<string, string | number>): string {
        return path.includes("?")
            ? `${this.server.uri}/api${path}&${querystring.stringify(params)}`
            : `${this.server.uri}/api${path}?${querystring.stringify(params)}`;
    }

    private getResponse(response: Utils.HttpResponse): ApiResponse {
        if (typeof response.statusCode === "undefined") {
            throw new Error(`Invalid response status ${response.statusCode}`);
        }

        if (response.headers.length % 2 !== 0) {
            throw new Error(`Invalid response headers ${JSON.stringify(response.headers)}`);
        }

        const responseHeaders = {};
        for (let i = 0; i < response.headers.length; i += 2) {
            const headerName = response.headers[i].toLowerCase();
            responseHeaders[headerName] = String(response.headers[i + 1]);
        }

        return {
            status: response.statusCode,
            headers: responseHeaders,
            body: response.data,
        };
    }
}
