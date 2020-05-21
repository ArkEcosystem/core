import got from "got";

import { ConnectionData } from "../contracts/http-client";

export class HttpClient {
    public constructor(private connectionData: ConnectionData) {}

    public async get(path: string): Promise<any> {
        const url = `${this.connectionData.protocol}://${this.connectionData.ip}:${this.connectionData.port}${path}`;

        return got.get(url).json();
    }
}
