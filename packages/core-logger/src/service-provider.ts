import { AbstractServiceProvider } from "@arkecosystem/core-kernel";
import { LogManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        this.app.bind(this.getAlias(), new LogManager());
    }
}
