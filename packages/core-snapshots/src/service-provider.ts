import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { AbstractServiceProvider } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { SnapshotManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        const manager = new SnapshotManager(this.opts);

        this.app.bind(this.getAlias(), manager.make(this.app.resolve<PostgresConnection>("database")));
    }

    /**
     * The default options of the plugin.
     */
    public getDefaults(): Record<string, any> {
        return defaults;
    }
}
