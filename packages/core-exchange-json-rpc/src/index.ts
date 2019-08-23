import { Contracts, Support } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import { start } from "@arkecosystem/exchange-json-rpc";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.config().get("enabled")) {
            this.app.resolve<Contracts.Kernel.Log.ILogger>("log").info("Exchange JSON-RPC Server is disabled");
            return;
        }

        this.config().set("network", Managers.configManager.get("network.name"));

        this.app.bind(
            "exchange-json-rpc",
            await start({
                database: this.config().get("database"),
                server: this.config().all(),
                logger: this.app.resolve<Contracts.Kernel.Log.ILogger>("log"),
            }),
        );
    }

    public async dispose(): Promise<void> {
        if (this.config().get("enabled")) {
            this.app.resolve<Contracts.Kernel.Log.ILogger>("log").info("Stopping Exchange JSON-RPC Server");

            await this.app.resolve("exchange-json-rpc").stop();
        }
    }

    public provides(): string[] {
        return ["exchange-json-rpc"];
    }
}
