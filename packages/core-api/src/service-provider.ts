import { Contracts, Providers } from "@arkecosystem/core-kernel";
import { Server } from "./server";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.config().get("enabled")) {
            this.ioc.get<Contracts.Kernel.Log.ILogger>("log").info("Public API is disabled");
            return;
        }

        this.ioc.bind("api.options").toConstantValue(this.config().all());

        this.ioc
            .bind<Server>("api")
            .to(Server)
            .inSingletonScope();
    }

    public async boot(): Promise<void> {
        await this.ioc.get<Server>("api").start();
    }

    public async dispose(): Promise<void> {
        if (this.config().get("enabled")) {
            this.ioc.get<Contracts.Kernel.Log.ILogger>("log").info(`Stopping Public API`);

            await this.ioc.get<Server>("api").stop();
        }
    }
}
