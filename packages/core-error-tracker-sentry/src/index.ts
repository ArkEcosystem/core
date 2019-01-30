import { AbstractServiceProvider } from "@arkecosystem/core-container";
import Sentry from "@sentry/node";
import { defaults } from "./defaults";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        Sentry.init(this.opts);

        this.app.bind(this.getAlias(), Sentry);
    }

    public getAlias(): string {
        return "error-tracker";
    }
}
