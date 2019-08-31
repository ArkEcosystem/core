import { Providers } from "@arkecosystem/core-kernel";

import { startServer } from "./server";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("vote-report").toConstantValue(await startServer(this.config().all()));
        this.app.bind("vote-report.options").toConstantValue(this.config().all());
    }

    public async dispose(): Promise<void> {
        await this.app.get<any>("vote-report").stop();
    }
}
