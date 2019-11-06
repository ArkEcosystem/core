import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

import { Utils } from "../utils";

// todo: remove this class and expose helpers as functions
@Container.injectable()
export class Controller {
    // todo: remove
    protected readonly config = Managers.configManager;

    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.ConfigRepository)
    protected readonly configRepository!: Services.Config.ConfigRepository;

    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly databaseService!: Contracts.Database.DatabaseService;

    protected paginate(request: Hapi.Request): any {
        return this.utils.paginate(request);
    }

    protected respondWithResource(data, transformer, transform = true): any {
        return this.utils.respondWithResource(data, transformer, transform);
    }

    protected respondWithCollection(data, transformer, transform = true): object {
        return this.utils.respondWithCollection(data, transformer, transform);
    }

    protected respondWithCache(data, h) {
        return this.utils.respondWithCache(data, h);
    }

    protected toResource(data, transformer, transform = true): object {
        return this.utils.toResource(data, transformer, transform);
    }

    protected toCollection(data, transformer, transform = true): object {
        return this.utils.toCollection(data, transformer, transform);
    }

    protected toPagination(data, transformer, transform = true): object {
        return this.utils.toPagination(data, transformer, transform);
    }

    private get utils(): Utils {
        return this.app.resolve<Utils>(Utils);
    }
}
