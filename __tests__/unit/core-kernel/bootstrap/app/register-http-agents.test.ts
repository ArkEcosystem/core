import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { RegisterHttpAgents } from "@packages/core-kernel/src/bootstrap/app";
import { Container } from "@packages/core-kernel/src/ioc";
import http from "http";
import https from "https";

let app: Application;

const httpAgent = http.globalAgent as any;
const httpsAgent = https.globalAgent as any;
const originalHttpKeepAlive = httpAgent.keepAlive;
const originalHttpsKeepAlive = httpsAgent.keepAlive;

beforeEach(() => {
    app = new Application(new Container());
});

afterEach(() => {
    httpAgent.keepAlive = originalHttpKeepAlive;
    httpsAgent.keepAlive = originalHttpsKeepAlive;
});

describe("RegisterHttpAgents", () => {
    it("should disable keep-alive on the global agents without replacing them", async () => {
        await app.resolve<RegisterHttpAgents>(RegisterHttpAgents).bootstrap();

        expect(http.globalAgent).toBe(httpAgent);
        expect(https.globalAgent).toBe(httpsAgent);
        expect(httpAgent.keepAlive).toBeFalse();
        expect(httpsAgent.keepAlive).toBeFalse();
    });

    it("should open a new connection for every request", async () => {
        await app.resolve<RegisterHttpAgents>(RegisterHttpAgents).bootstrap();

        const ports = new Set<number>();
        const headers = new Set<string | undefined>();
        const server = http.createServer((req, res) => {
            ports.add(req.socket.remotePort!);
            headers.add(req.headers.connection);
            res.end();
        });
        await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
        const { port } = server.address() as { port: number };

        const request = () =>
            new Promise<void>((resolve, reject) => {
                http.get({ host: "127.0.0.1", port, path: "/" }, (res) => {
                    res.resume();
                    res.on("end", resolve);
                }).on("error", reject);
            });

        await request();
        await request();
        await new Promise<void>((resolve) => server.close(() => resolve()));

        expect(ports.size).toBe(2);
        expect([...headers]).toEqual(["close"]);
    });
});
