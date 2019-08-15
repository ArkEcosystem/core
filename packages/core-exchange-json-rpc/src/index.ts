import { Contracts, Support } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import { start } from "@arkecosystem/exchange-json-rpc";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.opts.enabled) {
            this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Exchange JSON-RPC Server is disabled");
            return;
        }

        this.opts.network = Managers.configManager.get("network.name");

        this.app.bind(
            "exchange-json-rpc",
            await start({
                database: this.opts.database as string,
                server: this.opts,
                logger: this.app.resolve<Contracts.Kernel.ILogger>("logger"),
            }),
        );
    }

    public async dispose(): Promise<void> {
        if (this.opts.enabled) {
            this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Stopping Exchange JSON-RPC Server");

            await this.app.resolve("exchange-json-rpc").stop();
        }
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
