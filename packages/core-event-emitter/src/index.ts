import { AbstractServiceProvider } from "@arkecosystem/core-kernel";
import EventEmitter from "eventemitter3";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        this.app.bind(this.getAlias(), new EventEmitter());
    }
}
