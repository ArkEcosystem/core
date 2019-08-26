import { Support } from "@arkecosystem/core-kernel";
import Rollbar from "rollbar";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.ioc.bind("errorTracker").toConstantValue(new Rollbar(this.config().all()));
    }
}
