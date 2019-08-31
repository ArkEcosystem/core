import { Container, Providers, Services } from "@arkecosystem/core-kernel";

import { SignaleLogger } from "./driver";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const logManager: Services.Log.LogManager = this.app.get<Services.Log.LogManager>(
            Container.Identifiers.LogManager,
        );

        await logManager.extend("signale", async () => new SignaleLogger(this.config()).make());

        logManager.setDefaultDriver("signale");
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
