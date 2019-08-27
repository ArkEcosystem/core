import { Providers } from "@arkecosystem/core-kernel";
import { Server } from "./server";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.config().get("enabled")) {
            this.app.log.info("Public API is disabled");
            return;
        }

        this.app.bind("api.options").toConstantValue(this.config().all());

        this.app
            .bind<Server>("api")
            .to(Server)
            .inSingletonScope();
    }

    public async boot(): Promise<void> {
        await this.app.get<Server>("api").start();
    }

    public async dispose(): Promise<void> {
        if (this.config().get("enabled")) {
            this.app.log.info(`Stopping Public API`);

            await this.app.get<Server>("api").stop();
        }
    }
}
