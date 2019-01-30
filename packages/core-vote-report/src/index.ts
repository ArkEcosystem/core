import { Container } from "@arkecosystem/core-interfaces";
import { AbstractServiceProvider } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { startServer } from "./server";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        this.app.bind(this.getAlias(), await startServer(this.opts));
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        return this.app.resolve(this.getAlias()).stop();
    }

    /**
     * The default options of the plugin.
     */
    public getDefaults(): Record<string, any> {
        return defaults;
    }
}
