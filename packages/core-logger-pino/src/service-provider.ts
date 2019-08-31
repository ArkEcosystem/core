import { Container, Providers, Services } from "@arkecosystem/core-kernel";

import { PinoLogger } from "./driver";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const logManager: Services.Log.LogManager = this.app.get<Services.Log.LogManager>(
            Container.Identifiers.LogManager,
        );

        await logManager.extend("pino", async () => new PinoLogger(this.config().all()).make());

        logManager.setDefaultDriver("pino");
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
