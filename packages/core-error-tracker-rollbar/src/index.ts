import { Support } from "@arkecosystem/core-kernel";
import Rollbar from "rollbar";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("errorTracker", new Rollbar(this.config().all()));
    }

    public provides(): string[] {
        return ["errorTracker"];
    }
}
