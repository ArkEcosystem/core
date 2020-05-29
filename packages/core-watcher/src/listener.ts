import { Container, Contracts } from "@arkecosystem/core-kernel";

// import { DatabaseService } from "./database";
// import { Identifiers } from "./";

@Container.injectable()
export class Listener {
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly eventDispatcher!: Contracts.Kernel.EventDispatcher;

    // @Container.inject(Identifiers.EventsDatabaseService)
    // private readonly databaseService!: DatabaseService;

    public boot() {
        this.eventDispatcher.listen("*", {
            handle: (data: any) => {
                this.handleEvents(data);
            },
        });
    }

    private handleEvents(data: any) {
        console.log("Event *", data);
    }
}
