import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { isWhitelisted } from "@arkecosystem/core-utils";
import ip from "ip";
import { defaults } from "./defaults";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!isWhitelisted(this.app.resolve("api.options").whitelist, ip.address())) {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Wallet API is disabled");
            return;
        }

        return startServer(this.opts.server);
    }

    public async dispose(): Promise<void> {
        try {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Stopping Wallet API");

            await this.app.resolve("wallet-api").stop();
        } catch (error) {
            // do nothing...
        }
    }

    public manifest(): Types.PackageJson {
        return require("../package.json");
    }

    public defaults(): Types.ConfigObject {
        return defaults;
    }

    public provides(): string[] {
        return ["wallet-api"];
    }
}
