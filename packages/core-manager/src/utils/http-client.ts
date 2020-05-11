import axios from "axios"

export class HttpClient {
    public constructor(private protocol: string, private host: string, private port: string | number) {
    }

    public async get(path: string): Promise<any> {
        let url = `${this.protocol}://${this.host}:${this.port}${path}`

        return  (await axios.get(url)).data;
    }
}
