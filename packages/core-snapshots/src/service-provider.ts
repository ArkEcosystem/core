import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Support } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { SnapshotManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
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

    /**
     * The manifest of the plugin.
     */
    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
