import { Contracts, Support } from "@arkecosystem/core-kernel";
import { ConnectionManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.ioc.get<Contracts.Kernel.Log.ILogger>("log").info("Starting Database Manager");

        this.ioc
            .bind<ConnectionManager>("databaseManager")
            .to(ConnectionManager)
            .inSingletonScope();
    }
}
