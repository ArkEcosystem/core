import { Support } from "@arkecosystem/core-kernel";
import Sentry from "@sentry/node";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        Sentry.init(this.config().all());

        this.app.bind("errorTracker", Sentry);
    }

    public provides(): string[] {
        return ["errorTracker"];
    }
}
