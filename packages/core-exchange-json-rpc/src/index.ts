import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import { start } from "@arkecosystem/exchange-json-rpc";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.opts.enabled) {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Exchange JSON-RPC Server is disabled");
            return;
        }

        this.opts.network = Managers.configManager.get("network.name");

        this.app.bind(
            "exchange-json-rpc",
            await start({
                database: this.opts.database as string,
                server: this.opts,
                logger: this.app.resolve<Contracts.Kernel.ILogger>("log"),
            }),
        );
    }

    public async dispose(): Promise<void> {
        if (this.opts.enabled) {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Stopping Exchange JSON-RPC Server");

            await this.app.resolve("exchange-json-rpc").stop();
        }
    }

    public getDefaults(): Types.ConfigObject {
        return defaults;
    }

    public getPackageJson(): Types.PackageJson {
        return require("../package.json");
    }
}
