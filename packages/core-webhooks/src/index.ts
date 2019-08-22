import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { database } from "./database";
import { defaults } from "./defaults";
import { startListeners } from "./listener";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.opts.enabled) {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Webhooks are disabled");
            return;
        }

        database.make();

        startListeners();

        this.app.bind("webhooks", startServer(this.opts.server));
        this.app.bind("webhooks.options", this.opts);
    }

    public async dispose(): Promise<void> {
        if (this.opts.enabled) {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Stopping Webhook API");

            await this.app.resolve("webhooks").stop();
        }
    }

    public manifest(): Types.PackageJson {
        return require("../package.json");
    }

    public configDefaults(): Types.ConfigObject {
        return defaults;
    }

    public provides(): string[] {
        return ["webhooks"];
    }
}
