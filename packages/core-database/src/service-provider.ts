import { Contracts, Providers } from "@arkecosystem/core-kernel";
import { ConnectionManager } from "./manager";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.ioc.get<Contracts.Kernel.Log.ILogger>("log").info("Starting Database Manager");

        this.ioc
            .bind<ConnectionManager>("databaseManager")
            .to(ConnectionManager)
            .inSingletonScope();
    }
}
