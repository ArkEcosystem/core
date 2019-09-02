import { Providers } from "@arkecosystem/core-kernel";
import expandHomeDir from "expand-home-dir";
import { readFileSync } from "fs";

import { Server } from "./server";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("api.options").toConstantValue(this.config());

        if (this.config().get("server.http.enabled")) {
            this.app
                .bind<Server>("api.http")
                .to(Server)
                .inSingletonScope();

            const options: {
                enabled: boolean;
                host: string;
                port: number;
            } = { ...this.config().get("server.http") };

            delete options.enabled;

            await this.app.get<Server>("api.http").init(options, this.config().get("plugins"));
        }

        if (this.config().get("server.https.enabled")) {
            this.app
                .bind<Server>("api.https")
                .to(Server)
                .inSingletonScope();

            const options: {
                enabled: boolean;
                host: string;
                port: number;
                tls: {
                    key: string;
                    cert: string;
                };
            } = { ...this.config().get("server.https") };

            delete options.enabled;

            options.tls.key = readFileSync(expandHomeDir(options.tls.key)).toString();
            options.tls.cert = readFileSync(expandHomeDir(options.tls.cert)).toString();

            await this.app.get<Server>("api.https").init(options, this.config().get("plugins"));
        }
    }

    public async boot(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>("api.http").start();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>("api.https").start();
        }
    }

    public async dispose(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>("api.http").stop();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>("api.https").stop();
        }
    }
}
