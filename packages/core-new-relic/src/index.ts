import { Providers } from "@arkecosystem/core-kernel";
import newrelic from "newrelic";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("newRelic").toConstantValue(newrelic);
    }
}
