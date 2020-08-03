import { Providers } from "@arkecosystem/core-kernel";

import Handlers from "./handlers";
import { Identifiers } from "./identifiers";
import { preparePlugins } from "./plugins";
import { Server } from "./server";
import {
    DbBlockResourceService,
    DbBlockService,
    DbTransactionService,
    DposService,
    HtlcLockService,
    PoolTransactionService,
    TransactionService,
    WalletService,
} from "./services";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.DbBlockService).to(DbBlockService);
        this.app.bind(Identifiers.DbTransactionService).to(DbTransactionService);
        this.app.bind(Identifiers.DbBlockResourceService).to(DbBlockResourceService);
        this.app.bind(Identifiers.TransactionService).to(TransactionService);
        this.app.bind(Identifiers.WalletService).to(WalletService);
        this.app.bind(Identifiers.DposDelegateService).to(DposService);
        this.app.bind(Identifiers.HtlcLockService).to(HtlcLockService);
        this.app.bind(Identifiers.PoolTransactionService).to(PoolTransactionService);

        if (this.config().get("server.http.enabled")) {
            await this.buildServer("http", Identifiers.HTTP);
        }

        if (this.config().get("server.https.enabled")) {
            await this.buildServer("https", Identifiers.HTTPS);
        }
    }

    public async boot(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>(Identifiers.HTTP).boot();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>(Identifiers.HTTPS).boot();
        }
    }

    public async dispose(): Promise<void> {
        if (this.config().get("server.http.enabled")) {
            await this.app.get<Server>(Identifiers.HTTP).dispose();
        }

        if (this.config().get("server.https.enabled")) {
            await this.app.get<Server>(Identifiers.HTTPS).dispose();
        }
    }

    private async buildServer(type: string, id: symbol): Promise<void> {
        this.app.bind<Server>(id).to(Server).inSingletonScope();

        const server: Server = this.app.get<Server>(id);

        await server.initialize(`Public API (${type.toUpperCase()})`, {
            ...this.config().get(`server.${type}`),
            ...{
                routes: {
                    cors: true,
                },
            },
        });

        await server.register(preparePlugins(this.config().get("plugins")));

        await server.register({
            plugin: Handlers,
            routes: { prefix: "/api" },
        });
    }
}
