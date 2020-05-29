import { Container, Contracts } from "@arkecosystem/core-kernel";

import { DatabaseService } from "./database-service";

@Container.injectable()
export class Listener {
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly eventDispatcher!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.WatcherDatabaseService)
    private readonly databaseService!: DatabaseService;

    public boot() {
        this.eventDispatcher.listen("*", {
            handle: (data: any) => {
                this.handleEvents(data);
            },
        });
    }

    private handleEvents(data: { name: Contracts.Kernel.EventName; data: any }) {
        // console.log("Event *", data);
        this.databaseService.addEvent(data.name.toString(), data.data);
    }
}
