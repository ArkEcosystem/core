import { Contracts, Support } from "@arkecosystem/core-kernel";
import { isWhitelisted } from "@arkecosystem/core-utils";
import ip from "ip";
import { defaults } from "./defaults";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!isWhitelisted(this.app.resolveOptions("api").whitelist, ip.address())) {
            this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Wallet API is disabled");
            return;
        }

        return startServer(this.opts.server);
    }

    public async dispose(): Promise<void> {
        try {
            this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Stopping Wallet API");

            await this.app.resolve("wallet-api").stop();
        } catch (error) {
            // do nothing...
        }
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
