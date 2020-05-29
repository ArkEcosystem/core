import { Providers } from "@arkecosystem/core-kernel";

import { Identifiers } from "./identifiers";
import { Listener } from "./listener";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.WatcherEventListener).to(Listener).inSingletonScope();
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        this.app.get<Listener>(Identifiers.WatcherEventListener).boot();
    }

    public async dispose(): Promise<void> {}

    public async required(): Promise<boolean> {
        return false;
    }
}
