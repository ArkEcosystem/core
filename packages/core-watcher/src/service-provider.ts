import { Container, Providers } from "@arkecosystem/core-kernel";

import { DatabaseService } from "./database-service";
import { Listener } from "./listener";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Container.Identifiers.WatcherEventListener).to(Listener).inSingletonScope();
        this.app.bind(Container.Identifiers.WatcherDatabaseService).to(DatabaseService).inSingletonScope();
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        this.app.get<DatabaseService>(Container.Identifiers.WatcherDatabaseService).boot();
        this.app.get<Listener>(Container.Identifiers.WatcherEventListener).boot();
    }

    public async dispose(): Promise<void> {
        this.app.get<DatabaseService>(Container.Identifiers.WatcherDatabaseService).dispose();
    }

    public async required(): Promise<boolean> {
        return false;
    }
}
