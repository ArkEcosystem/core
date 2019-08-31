import { Container, Providers, Services } from "@arkecosystem/core-kernel";

import { WinstonLogger } from "./driver";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const logManager: Services.Log.LogManager = this.app.get<Services.Log.LogManager>(
            Container.Identifiers.LogManager,
        );

        await logManager.extend("winston", async () => new WinstonLogger(this.config()).make());

        logManager.setDefaultDriver("winston");
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
