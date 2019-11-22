import { Container, Contracts, Enums, Providers } from "@arkecosystem/core-kernel";

import { ForgerManager } from "./forger-manager";
import { ForgerTracker } from "./forger-tracker";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const forgerManager: ForgerManager = this.app.resolve<ForgerManager>(ForgerManager);

        forgerManager.init(this.config().all());

        this.app.bind("forger").toConstantValue(forgerManager);
    }

    public async boot(): Promise<void> {
        await this.app
            .get<ForgerManager>("forger")
            .startForging(this.config().get("bip38"), this.config().get("password"));

        // Don't keep bip38 password in memory
        this.config().set("bip38", undefined);
        this.config().set("password", undefined);

        this.startTracker();
    }

    public async dispose(): Promise<void> {
        this.app.log.info("Stopping Forger Manager");

        return this.app.get<ForgerManager>("forger").stopForging();
    }

    private startTracker(): void {
        if (this.config().get("tracker") === true) {
            const forgerTracker: ForgerTracker = this.app.resolve<ForgerTracker>(ForgerTracker);

            this.app
                .get<Contracts.Kernel.Events.EventDispatcher>(Container.Identifiers.EventDispatcherService)
                .listen(Enums.BlockEvent.Applied, async () => forgerTracker.execute());
        }
    }
}
