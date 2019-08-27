import { Contracts, Providers } from "@arkecosystem/core-kernel";
import { ConnectionManager } from "./manager";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.get<Contracts.Kernel.Log.Logger>("log").info("Starting Database Manager");

        this.app
            .bind<ConnectionManager>("databaseManager")
            .to(ConnectionManager)
            .inSingletonScope();
    }
}
