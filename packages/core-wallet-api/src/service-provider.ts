import { Contracts, Support } from "@arkecosystem/core-kernel";
import { isWhitelisted } from "@arkecosystem/core-utils";
import ip from "ip";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!isWhitelisted(this.app.resolve("api.options").whitelist, ip.address())) {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Wallet API is disabled");
            return;
        }

        return startServer(this.config().get("server"));
    }

    public async dispose(): Promise<void> {
        try {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Stopping Wallet API");

            await this.app.resolve("wallet-api").stop();
        } catch (error) {
            // do nothing...
        }
    }

    public provides(): string[] {
        return ["wallet-api"];
    }
}
