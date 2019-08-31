import { Container, Providers } from "@arkecosystem/core-kernel";

import { ConnectionManager } from "./manager";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.log.info("Starting Database Manager");

        this.app
            .bind<ConnectionManager>(Container.Identifiers.DatabaseManager)
            .to(ConnectionManager)
            .inSingletonScope();
    }
}
