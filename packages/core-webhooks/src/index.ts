import { Contracts, Support } from "@arkecosystem/core-kernel";
import { database } from "./database";
import { startListeners } from "./listener";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.config().get("enabled")) {
            this.ioc.get<Contracts.Kernel.Log.ILogger>("log").info("Webhooks are disabled");
            return;
        }

        database.make();

        startListeners();

        this.ioc.bind("webhooks").toConstantValue(await startServer(this.config().get("server")));
        this.ioc.bind("webhooks.options").toConstantValue(this.config().all());
    }

    public async dispose(): Promise<void> {
        if (this.config().get("enabled")) {
            this.ioc.get<Contracts.Kernel.Log.ILogger>("log").info("Stopping Webhook API");

            await this.ioc.get<any>("webhooks").stop();
        }
    }
}
