import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { EventsDatabaseService } from "./database/events-database-service";

@Container.injectable()
export class Listener {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.WatcherDatabaseService)
    private readonly databaseService!: EventsDatabaseService;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    public boot(): void {
        this.events.listen("*", {
            handle: (data: any) => {
                this.handleEvents(data);
            },
        });
    }

    private handleEvents(data: { name: Contracts.Kernel.EventName; data: any }) {
        if (this.canAddEvent(data.name.toString())) {
            this.databaseService.add(data.name.toString(), data.data);
        }
    }

    private canAddEvent(name: string): boolean {
        if (name.startsWith("block") && !this.configuration.getRequired<boolean>("watcher.watch.blocks")) {
            return false;
        }
        if (name.startsWith("log.error") && !this.configuration.getRequired<boolean>("watcher.watch.errors")) {
            return false;
        }
        if (name.startsWith("queue") && !this.configuration.getRequired<boolean>("watcher.watch.queues")) {
            return false;
        }
        if (name.startsWith("round") && !this.configuration.getRequired<boolean>("watcher.watch.rounds")) {
            return false;
        }
        if (name.startsWith("schedule") && !this.configuration.getRequired<boolean>("watcher.watch.schedules")) {
            return false;
        }
        if (name.startsWith("transaction") && !this.configuration.getRequired<boolean>("watcher.watch.transactions")) {
            return false;
        }
        if (name.startsWith("webhooks") && !this.configuration.getRequired<boolean>("watcher.watch.webhooks")) {
            return false;
        }

        return true;
    }
}
