import { Contracts, Support } from "@arkecosystem/core-kernel";
import { Server } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.config().get("enabled")) {
            this.app.resolve<Contracts.Kernel.Log.ILogger>("log").info("Public API is disabled");
            return;
        }

        this.app.bind("api.options", this.config().all());
        this.app.singleton<Server>("api", Server);
    }

    public async boot(): Promise<void> {
        await this.app.resolve<Server>("api").start();
    }

    public async dispose(): Promise<void> {
        if (this.config().get("enabled")) {
            this.app.resolve<Contracts.Kernel.Log.ILogger>("log").info(`Stopping Public API`);

            await this.app.resolve<Server>("api").stop();
        }
    }

    public provides(): string[] {
        return ["api"];
    }
}
