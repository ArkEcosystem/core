import { Providers } from "@arkecosystem/core-kernel";
import Sentry from "@sentry/node";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        Sentry.init(this.config().all());

        this.app.bind("errorTracker").toConstantValue(Sentry);
    }
}
