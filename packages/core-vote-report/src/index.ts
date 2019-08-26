import { Providers } from "@arkecosystem/core-kernel";
import { startServer } from "./server";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.ioc.bind("vote-report").toConstantValue(await startServer(this.config().all()));
        this.ioc.bind("vote-report.options").toConstantValue(this.config().all());
    }

    public async dispose(): Promise<void> {
        await this.ioc.get<any>("vote-report").stop();
    }
}
