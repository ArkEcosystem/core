import { Identifiers, Server } from "@arkecosystem/core-api";
import { Container, Utils } from "@arkecosystem/core-kernel";
import querystring from "querystring";

type ApiResponse = {
    status: number;
    headers: Record<string, string>;
    data: any;
};

@Container.injectable()
export class ApiHttpClient {
    @Container.inject(Identifiers.HTTP)
    private readonly server!: Server;

    public async get(
        path: string,
        options = {
            params: {} as Record<string, string>,
        },
    ): Promise<ApiResponse> {
        const url = `${this.server.uri}/api${path}?${querystring.stringify(options.params)}`;
        const response = await Utils.http.get(url);

        return this.parseHttpResponse(response);
    }

    public async post(
        path: string,
        body: unknown,
        options = {
            params: {} as Record<string, string>,
        },
    ): Promise<ApiResponse> {
        const url = `${this.server.uri}/api${path}?${querystring.stringify(options.params)}`;
        const response = await Utils.http.post(url, { body: body as any });

        return this.parseHttpResponse(response);
    }

    private parseHttpResponse(response: Utils.HttpResponse): ApiResponse {
        if (typeof response.statusCode === "undefined") {
            throw new Error(`Invalid response status ${response.statusCode}`);
        }

        if (response.headers.length % 2 !== 0) {
            throw new Error(`Invalid response headers ${JSON.stringify(response.headers)}`);
        }

        const responseHeaders = {};
        for (let i = 0; i < response.headers.length; i += 2) {
            const headerName = response.headers[i].toLowerCase();
            const headerValue = String(response.headers[i + 1]);
            responseHeaders[headerName] = headerValue;
        }

        return {
            status: response.statusCode,
            headers: responseHeaders,
            data: response.data,
        };
    }
}
