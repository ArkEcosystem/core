import { Providers } from "@arkecosystem/core-kernel";
import { isWhitelisted } from "@arkecosystem/core-utils";
import ip from "ip";

import { startServer } from "./server";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        if (!isWhitelisted(this.app.get<any>("api.options").whitelist, ip.address())) {
            this.app.log.info("Wallet API is disabled");
            return;
        }

        return startServer(this.config().get("server"));
    }

    public async dispose(): Promise<void> {
        try {
            this.app.log.info("Stopping Wallet API");

            await this.app.get<any>("wallet-api").stop();
        } catch (error) {
            // do nothing...
        }
    }
}
