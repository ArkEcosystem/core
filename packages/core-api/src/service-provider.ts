import { Contracts, Support } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { Server } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.opts.enabled) {
            this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Public API is disabled");
            return;
        }

        const server = new Server(this.opts);
        await server.start();

        this.app.bind("api", server);
    }

    public async dispose(): Promise<void> {
        if (this.opts.enabled) {
            this.app.resolve<Contracts.Kernel.ILogger>("logger").info(`Stopping Public API`);

            await this.app.resolve<Server>("api").stop();
        }
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
