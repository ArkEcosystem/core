import { Enums, Providers, Types } from "@arkecosystem/core-kernel";

import { Database } from "./database";
import { Identifiers } from "./identifiers";
import { Listener } from "./listener";
import { Server } from "./server";

/**
 * @export
 * @class ServiceProvider
 * @extends {Providers.ServiceProvider}
 */
export class ServiceProvider extends Providers.ServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        // Setup Database...
        this.app
            .bind<Database>(Identifiers.Database)
            .to(Database)
            .inSingletonScope();

        this.app.get<Database>(Identifiers.Database).boot();

        // Setup Server...
        this.app
            .bind(Identifiers.Server)
            .to(Server)
            .inSingletonScope();

        this.app.get<Server>(Identifiers.Server).register(this.config().get<Types.JsonObject>("server")!);

        // Setup Listeners...
        this.startListeners();
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        await this.app.get<any>(Identifiers.Server).start();
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async dispose(): Promise<void> {
        await this.app.get<any>(Identifiers.Server).stop();
    }

    /**
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async bootWhen(): Promise<boolean> {
        return this.config().get("enabled") === true;
    }

    /**
     * @private
     * @memberof ServiceProvider
     */
    private startListeners(): void {
        for (const event of Object.values(Enums.StateEvent)) {
            this.app.events.listen(event, async payload => this.app.resolve(Listener).listen(event, payload));
        }
    }
}
