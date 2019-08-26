import { Support } from "@arkecosystem/core-kernel";
import newrelic from "newrelic";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.ioc.bind("newRelic").toConstantValue(newrelic);
    }
}
