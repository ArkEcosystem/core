import { Providers } from "@arkecosystem/core-kernel";
import newrelic from "newrelic";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("newRelic").toConstantValue(newrelic);
    }
}
