import { Contracts, Support } from "@arkecosystem/core-kernel";
import { database } from "./database";
import { startListeners } from "./listener";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.config().get("enabled")) {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Webhooks are disabled");
            return;
        }

        database.make();

        startListeners();

        this.app.bind("webhooks", startServer(this.config().get("server")));
        this.app.bind("webhooks.options", this.config().all());
    }

    public async dispose(): Promise<void> {
        if (this.config().get("enabled")) {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Stopping Webhook API");

            await this.app.resolve("webhooks").stop();
        }
    }

    public provides(): string[] {
        return ["webhooks"];
    }
}
